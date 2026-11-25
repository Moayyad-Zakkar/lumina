// src/ui/Pages/patient/NotificationsPage.jsx
// Route (inside the patient layout, no loader needed):
//   { element: <NotificationsPage />, path: '/patient/notifications' }
import React from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import PatientShell from '../../components/PatientShell';
import NotificationList from '../../components/NotificationList';
import { useNotifications } from '../../../hooks/useNotifications';
import { routeForNotification } from '../../../helper/notificationRoutes';
import { PATIENT_PATHS } from '../patientPaths';

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, unread, loading, markRead, markAllRead } = useNotifications({ limit: 100 });

  const openItem = (n) => {
    if (n.status === 'unread') markRead(n.id);
    const route = routeForNotification(n, 'patient');
    if (route) navigate(route);
  };

  return (
    <PatientShell backTo={PATIENT_PATHS.home} title={t('notifications.pageTitle')} hideBell>
      {unread > 0 && (
        <button
          type="button"
          onClick={markAllRead}
          className="self-end text-caption text-brand-600 underline"
        >
          {t('notifications.markAllRead')}
        </button>
      )}
      <NotificationList items={items} loading={loading} onOpen={openItem} />
    </PatientShell>
  );
}