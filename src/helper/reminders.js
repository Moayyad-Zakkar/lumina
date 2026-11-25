// src/helper/reminders.js
// Local (on-device) reminders for patients: daily wear log + aligner switch.
// They are scheduled on the phone, so they work offline and need no Firebase.
// Everything is re-planned from scratch on every sync (see useReminderSync), so the
// schedule always follows the latest data: a day that is already logged is skipped,
// and a changed switch date moves the reminder.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import i18n from 'i18next';
import { addDays, archStatus, parseLocalDate, totalAligners } from './patientTracking';

export const isNativePlatform = Capacitor.isNativePlatform();

const t = (key, opts) => i18n.t(`patientTracking.reminders.${key}`, opts);

const SETTINGS_KEY = 'reminder_settings';
const DEFAULTS = { dailyLog: true, dailyTime: '20:00', switchReminders: true };

// Notification ids owned by this file: 1000-2999 (1000.. daily, 2000.. switch).
const DAILY_BASE = 1000;
const DAILY_DAYS = 14; // how many days ahead are scheduled; refreshed on every app open
const SWITCH_BASE = 2000;
const ID_MAX = 3000;
const CHANNEL_ID = 'reminders';
const SWITCH_EVENING = '20:00';
const SWITCH_MORNING = '08:00';

let navigateFn = null;
let tapListenerAdded = false;

// ------------------------------------------------------------------ settings
export async function getReminderSettings() {
  try {
    const { value } = await Preferences.get({ key: SETTINGS_KEY });
    return { ...DEFAULTS, ...(value ? JSON.parse(value) : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

export async function saveReminderSettings(settings) {
  await Preferences.set({ key: SETTINGS_KEY, value: JSON.stringify(settings) });
}

// ---------------------------------------------------------------- permission
export async function ensureReminderPermission() {
  if (!isNativePlatform) return false;
  let perm = await LocalNotifications.checkPermissions();
  if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') {
    perm = await LocalNotifications.requestPermissions();
  }
  return perm.display === 'granted';
}

async function permissionGranted() {
  const perm = await LocalNotifications.checkPermissions();
  return perm.display === 'granted';
}

// ------------------------------------------------------------------- helpers
function atTime(iso, hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = parseLocalDate(iso);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

const inFuture = (date) => date.getTime() > Date.now() + 10_000;

async function cancelOurs() {
  const { notifications } = await LocalNotifications.getPending();
  const mine = notifications
    .filter((n) => n.id >= DAILY_BASE && n.id < ID_MAX)
    .map((n) => ({ id: n.id }));
  if (mine.length) await LocalNotifications.cancel({ notifications: mine });
}

// Call on sign-out so the next person using the phone does not get these.
export async function clearReminders() {
  if (!isNativePlatform) return;
  try {
    await cancelOurs();
  } catch (e) {
    console.error('clearReminders failed', e);
  }
}

// ------------------------------------------------------------------ planning
function buildDaily(bundle, settings) {
  if (!settings.dailyLog) return [];
  const { today, arches, schedule, arch: info, logs } = bundle;

  // Only remind while treatment is actually running for at least one arch.
  const active = arches.some((a) => {
    const kind = archStatus(info[a], totalAligners(schedule, a), today).kind;
    return kind === 'running' || kind === 'switchToday' || kind === 'switchOverdue';
  });
  if (!active) return [];

  const loggedToday = logs.some((l) => l.log_date === today);
  const out = [];
  for (let i = 0; i < DAILY_DAYS; i += 1) {
    if (i === 0 && loggedToday) continue;
    const at = atTime(addDays(today, i), settings.dailyTime);
    if (!inFuture(at)) continue;
    out.push({
      id: DAILY_BASE + i,
      title: t('dailyTitle'),
      body: t('dailyBody'),
      channelId: CHANNEL_ID,
      schedule: { at, allowWhileIdle: true },
      extra: { route: '/patient/log' },
    });
  }
  return out;
}

function buildSwitch(bundle, settings) {
  if (!settings.switchReminders) return [];
  const { today, arches, schedule, arch: info } = bundle;

  // One event per arch; events on the same day/time/kind are merged into one notification.
  const events = [];
  for (const a of arches) {
    const st = archStatus(info[a], totalAligners(schedule, a), today);

    if (st.kind === 'running' && !st.final && st.switchOn) {
      const n = st.current + 1;
      events.push({ day: addDays(st.switchOn, -1), time: SWITCH_EVENING, kind: 'tomorrow', arch: a, n });
      events.push({ day: st.switchOn, time: SWITCH_MORNING, kind: 'today', arch: a, n });
    } else if (st.kind === 'switchToday' || st.kind === 'switchOverdue') {
      // Due now and not done yet: a gentle evening nudge, for a few days at most.
      for (let i = 0; i < 3; i += 1) {
        events.push({
          day: addDays(today, i),
          time: SWITCH_EVENING,
          kind: st.kind === 'switchToday' && i === 0 ? 'today' : 'overdue',
          arch: a,
          n: st.next,
        });
      }
    }
  }

  const groups = new Map();
  for (const e of events) {
    const key = `${e.day}|${e.time}|${e.kind}`;
    if (!groups.has(key)) groups.set(key, { ...e, lines: [] });
    groups.get(key).lines.push(
      t(e.arch === 'upper' ? 'lineUpper' : 'lineLower', { n: e.n }),
    );
  }

  const titleKey = {
    tomorrow: 'switchTomorrowTitle',
    today: 'switchTodayTitle',
    overdue: 'switchOverdueTitle',
  };

  return [...groups.values()]
    .sort((a, b) => `${a.day} ${a.time}`.localeCompare(`${b.day} ${b.time}`))
    .map((g, idx) => ({ g, idx, at: atTime(g.day, g.time) }))
    .filter(({ at }) => inFuture(at))
    .slice(0, 50)
    .map(({ g, idx, at }) => ({
      id: SWITCH_BASE + idx,
      title: t(titleKey[g.kind]),
      body: g.lines.join(' · '),
      channelId: CHANNEL_ID,
      schedule: { at, allowWhileIdle: true },
      extra: { route: '/patient' },
    }));
}

// Re-plan all reminders from the tracking bundle (the patientTrackingLoader result).
export async function syncReminders(bundle) {
  if (!isNativePlatform || !bundle?.caseId) return;

  const settings = await getReminderSettings();
  await cancelOurs();
  if (!settings.dailyLog && !settings.switchReminders) return;
  if (!(await permissionGranted())) return; // the Reminders page asks for permission

  await LocalNotifications.createChannel({
    id: CHANNEL_ID,
    name: 'Reminders',
    description: 'Daily wear log and aligner switch reminders',
    importance: 3,
    visibility: 1,
  });

  const notifications = [...buildDaily(bundle, settings), ...buildSwitch(bundle, settings)];
  if (notifications.length) await LocalNotifications.schedule({ notifications });
}

// ------------------------------------------------------------------ tapping
// Call once from the patient layout so tapping a reminder opens the right page.
export async function initReminders(navigate) {
  if (!isNativePlatform) return;
  navigateFn = navigate;
  if (tapListenerAdded) return;
  tapListenerAdded = true;
  await LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const route = action.notification?.extra?.route;
    if (route && navigateFn) navigateFn(route);
  });
}