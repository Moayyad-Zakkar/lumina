// src/ui/Pages/patient/RemindersPage.jsx
// Route:
//   { path: '/patient/reminders', loader: patientTrackingLoader, element: <RemindersPage /> }
import React, { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Error from '../../components/Error';
import PatientShell from '../../components/PatientShell';
import { PATIENT_PATHS } from '../patientPaths';
import {
  ensureReminderPermission,
  getReminderSettings,
  isNativePlatform,
  saveReminderSettings,
  syncReminders,
} from '../../../helper/reminders';

const p = 'patientTracking.reminders';

const rowCls =
  'flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm';

export default function RemindersPage() {
  const data = useLoaderData();
  const { t } = useTranslation();

  if (data.error) return <Error error={data.error} />;

  if (!data.caseId) {
    return (
      <PatientShell
        backTo={PATIENT_PATHS.home}
        title={t(`${p}.pageTitle`)}
        subtitle={t('patientTracking.noActiveCase')}
      />
    );
  }

  return <RemindersView data={data} />;
}

function RemindersView({ data }) {
  const { t } = useTranslation();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    getReminderSettings().then(setSettings);
  }, []);

  const update = async (patch) => {
    const next = { ...settings, ...patch };

    // Turning a reminder on is the moment to ask for the Android notification permission.
    if (patch.dailyLog === true || patch.switchReminders === true) {
      const ok = await ensureReminderPermission();
      if (!ok) {
        toast.error(t(`${p}.permissionDenied`));
        return;
      }
    }

    setSettings(next);
    try {
      await saveReminderSettings(next);
      await syncReminders(data);
      toast.success(t(`${p}.saved`));
    } catch (e) {
      toast.error(e.message || String(e));
    }
  };

  if (!settings) return null;

  return (
    <PatientShell backTo={PATIENT_PATHS.home} title={t(`${p}.pageTitle`)}>
      {!isNativePlatform && (
        <p className="text-center text-body text-subtext-color">{t(`${p}.webOnly`)}</p>
      )}

      <div className="flex w-full flex-col gap-3">
        <label className={rowCls}>
          <span className="flex min-w-0 flex-col">
            <span className="text-body-bold">{t(`${p}.dailyLog`)}</span>
            <span className="text-caption text-subtext-color">{t(`${p}.dailyLogHint`)}</span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 flex-none"
            disabled={!isNativePlatform}
            checked={settings.dailyLog}
            onChange={(e) => update({ dailyLog: e.target.checked })}
          />
        </label>

        {settings.dailyLog && (
          <label className={rowCls}>
            <span className="text-body-bold">{t(`${p}.dailyTime`)}</span>
            <input
              type="time"
              disabled={!isNativePlatform}
              value={settings.dailyTime}
              onChange={(e) => e.target.value && update({ dailyTime: e.target.value })}
              className="rounded-2xl border border-solid border-neutral-border px-3 py-2 text-body"
            />
          </label>
        )}

        <label className={rowCls}>
          <span className="flex min-w-0 flex-col">
            <span className="text-body-bold">{t(`${p}.switchReminders`)}</span>
            <span className="text-caption text-subtext-color">
              {t(`${p}.switchRemindersHint`)}
            </span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-5 flex-none"
            disabled={!isNativePlatform}
            checked={settings.switchReminders}
            onChange={(e) => update({ switchReminders: e.target.checked })}
          />
        </label>
      </div>
    </PatientShell>
  );
}