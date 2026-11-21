import supabase from './supabaseClient';

export const ARCHES = ['upper', 'lower'];

// ---------------------------------------------------------------- dates
// All dates are plain calendar dates (YYYY-MM-DD) in the DEVICE's timezone.
// Never use toISOString().slice(0, 10) for this: it is UTC and is a day off
// for Syria between 00:00 and 03:00.
const pad = (n) => String(n).padStart(2, '0');

export function toLocalISODate(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseLocalDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso, n) {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + n);
  return toLocalISODate(d);
}

export function formatDate(iso, locale, opts = { day: 'numeric', month: 'short' }) {
  return parseLocalDate(iso).toLocaleDateString(locale, opts);
}

// ------------------------------------------------------- pure schedule logic
export const rowsForArch = (rows, arch) => rows.filter((r) => r.arch === arch);

export function totalAligners(schedule, arch) {
  return rowsForArch(schedule, arch).reduce(
    (max, r) => Math.max(max, r.aligner_number),
    0,
  );
}

// Which aligner was the patient on, for this arch, on the given calendar date?
// = the most recently started aligner whose start date is on/before that date.
export function alignerOnDate(starts, arch, iso) {
  let best = null;
  for (const s of starts) {
    if (s.arch !== arch || s.started_on > iso) continue;
    if (
      !best ||
      s.started_on > best.started_on ||
      (s.started_on === best.started_on && s.aligner_number > best.aligner_number)
    ) {
      best = s;
    }
  }
  return best ? best.aligner_number : null;
}

export function firstStartDate(starts) {
  if (!starts.length) return null;
  return starts.map((s) => s.started_on).sort()[0];
}

// Turns an arch_progress() row into a small state object for the UI.
export function archStatus(info, total, today) {
  if (!info || info.current_aligner == null) return { kind: 'notStarted' };
  const next = info.current_aligner + 1;
  if (info.next_switch_on && info.next_switch_on <= today) {
    if (info.is_last_stage) return { kind: 'finished' };
    return {
      kind: info.next_switch_on === today ? 'switchToday' : 'switchOverdue',
      next,
    };
  }
  return {
    kind: 'running',
    current: info.current_aligner,
    total,
    switchOn: info.next_switch_on,
    final: info.is_last_stage,
  };
}

// ------------------------------------------------------------------ loading
export async function loadPatientCaseId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // A returning patient may have several cases (refinements): use the latest.
  const { data, error } = await supabase
    .from('case_patients')
    .select('case_id')
    .eq('patient_id', user.id)
    .order('case_id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.case_id ?? null;
}

export async function loadTrackingBundle(caseId, today = toLocalISODate()) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const since = addDays(today, -60);

  const results = await Promise.all([
    supabase
      .from('aligner_schedule')
      .select('arch, aligner_number, wear_days')
      .eq('case_id', caseId)
      .order('aligner_number'),
    supabase
      .from('aligner_starts')
      .select('arch, aligner_number, started_on')
      .eq('case_id', caseId),
    supabase
      .from('daily_wear_logs')
      .select('id, arch, aligner_number, log_date, hours_worn')
      .eq('case_id', caseId)
      .gte('log_date', since)
      .order('log_date', { ascending: false }),
    supabase.rpc('arch_progress', { p_case_id: caseId, p_arch: 'upper', p_today: today }),
    supabase.rpc('arch_progress', { p_case_id: caseId, p_arch: 'lower', p_today: today }),
    supabase.rpc('case_progress', { p_case_id: caseId, p_today: today }),
  ]);
  // The doctor's general note + prescribed wear time. Fetched separately and NOT part of the
  // failure check: if this one request fails the home page still works, just without the card.
  const instr = await supabase
    .from('treatment_instructions')
    .select('notes, wear_hours_per_day')
    .eq('case_id', caseId)
    .maybeSingle();
  const failed = results.find((r) => r.error);
  if (failed) throw failed.error;
  const [schedule, starts, logs, upper, lower, overall] = results;

  return {
    caseId,
    userId: user.id,
    today,
    schedule: schedule.data,
    starts: starts.data,
    logs: logs.data,
    arch: { upper: upper.data?.[0] ?? null, lower: lower.data?.[0] ?? null },
    // An arch only exists for this case if the doctor gave it a schedule.
    arches: ARCHES.filter((a) => schedule.data.some((r) => r.arch === a)),
    overall: overall.data, // slower arch, 0-100 or null
    instructions: instr.error ? null : instr.data, // { notes, wear_hours_per_day } | null
  };
}

// Route loader shared by the home, arch and daily-log pages.
export async function patientTrackingLoader() {
  try {
    const caseId = await loadPatientCaseId();
    if (!caseId) return { caseId: null };
    return await loadTrackingBundle(caseId);
  } catch (e) {
    return { error: e.message || String(e) };
  }
}

// ------------------------------------------------------------------ actions
// Re-derive aligner_number on an arch's wear logs from the current start dates,
// so logs stay attached to the right aligner after a start date is edited/undone.
export async function retagLogs(caseId, arch) {
  const [starts, logs] = await Promise.all([
    supabase
      .from('aligner_starts')
      .select('arch, aligner_number, started_on')
      .eq('case_id', caseId)
      .eq('arch', arch),
    supabase
      .from('daily_wear_logs')
      .select('id, aligner_number, log_date')
      .eq('case_id', caseId)
      .eq('arch', arch),
  ]);
  if (starts.error) throw starts.error;
  if (logs.error) throw logs.error;

  const stale = logs.data
    .map((l) => ({ id: l.id, want: alignerOnDate(starts.data, arch, l.log_date), have: l.aligner_number }))
    .filter((x) => x.want != null && x.want !== x.have);

  const updates = await Promise.all(
    stale.map((x) =>
      supabase.from('daily_wear_logs').update({ aligner_number: x.want }).eq('id', x.id),
    ),
  );
  const bad = updates.find((u) => u.error);
  if (bad) throw bad.error;
}

// Start aligner N (or correct its start date). One row per (case, arch, aligner).
export async function startAligner({ caseId, userId, arch, alignerNumber, startedOn }) {
  const { error } = await supabase.from('aligner_starts').upsert(
    {
      case_id: caseId,
      patient_id: userId,
      arch,
      aligner_number: alignerNumber,
      started_on: startedOn,
    },
    { onConflict: 'case_id,arch,aligner_number' },
  );
  if (error) throw error;
  await retagLogs(caseId, arch);
}

// "I tapped switch by mistake": remove the latest start; logs go back to the previous aligner.
export async function undoLastStart({ caseId, arch, alignerNumber }) {
  const { error } = await supabase
    .from('aligner_starts')
    .delete()
    .eq('case_id', caseId)
    .eq('arch', arch)
    .eq('aligner_number', alignerNumber);
  if (error) throw error;
  await retagLogs(caseId, arch);
}

// One day's wear time. entries = [{ arch, alignerNumber, hours }]
export async function saveWearHours({ caseId, userId, date, entries }) {
  const rows = entries.map((e) => ({
    case_id: caseId,
    patient_id: userId,
    arch: e.arch,
    aligner_number: e.alignerNumber,
    log_date: date,
    hours_worn: e.hours,
  }));
  const { error } = await supabase
    .from('daily_wear_logs')
    .upsert(rows, { onConflict: 'case_id,arch,log_date' });
  if (error) throw error;
}