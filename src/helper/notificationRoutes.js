// src/helper/notificationRoutes.js
// Where a notification should open. Shared by the bell inbox and by push taps.
// `role` is the profile role: 'patient', 'user' (doctor), 'admin' or 'super_admin'.
export function routeForNotification(n, role) {
  const d = n?.data || {};
  const caseId = n?.case_id ?? d.case_id ?? null;
  const r = role === 'super_admin' ? 'admin' : role;

  switch (n?.type) {
    case 'issue_reply': // doctor answered the patient
      return '/patient/help';
    case 'issue_new': // patient wrote to the doctor
    case 'patient_photos':
    case 'patient_feedback':
      return caseId ? `/app/cases/${caseId}` : null;
    case 'case':
      if (!caseId) return null;
      if (r === 'admin') return `/admin/cases/${caseId}`;
      if (r === 'user') return `/app/cases/${caseId}`;
      return null;
    default: // 'broadcast' and anything unknown: nothing to open
      return null;
  }
}