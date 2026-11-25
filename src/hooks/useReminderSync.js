// src/hooks/useReminderSync.js
// Put `useReminderSync()` at the top of every patient page whose route uses
// patientTrackingLoader. It re-plans the local reminders whenever that data changes:
// on app open, and again after the patient logs wear time or starts an aligner.
import { useEffect } from 'react';
import { useLoaderData } from 'react-router';
import { syncReminders } from '../helper/reminders';

export function useReminderSync() {
  const data = useLoaderData();

  useEffect(() => {
    if (data && data.caseId) {
      syncReminders(data).catch((e) => console.error('reminder sync failed', e));
    }
  }, [data]);
}