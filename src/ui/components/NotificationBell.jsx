// src/ui/components/NotificationBell.jsx
//   <NotificationBell mode="link" to="/patient/notifications" role="patient" />   patients (opens a page)
//   <NotificationBell mode="popover" role="user" />                                 doctors
//   <NotificationBell mode="popover" role="admin" />                                admins
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FeatherBell, FeatherX } from '@subframe/core';
import { useNotifications } from '../../hooks/useNotifications';
import { routeForNotification } from '../../helper/notificationRoutes';
import NotificationList from './NotificationList';

const btnCls =
  'relative flex h-10 w-10 flex-none items-center justify-center rounded-full bg-white shadow-sm';

export default function NotificationBell({ mode = 'popover', to = undefined, role = undefined }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userId, items, unread, loading, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);

  if (!userId) return null; // not signed in

  const badge =
    unread > 0 ? (
      <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">
        {unread > 99 ? '99+' : unread}
      </span>
    ) : null;

  if (mode === 'link') {
    return (
      <Link to={to} aria-label={t('notifications.bell')} className={btnCls}>
        <FeatherBell className="h-5 w-5 text-brand-600" />
        {badge}
      </Link>
    );
  }

  const openItem = (n) => {
    setOpen(false);
    if (n.status === 'unread') markRead(n.id);
    const route = routeForNotification(n, role);
    if (route) navigate(route);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('notifications.bell')}
        className={btnCls}
      >
        <FeatherBell className="h-5 text-brand-600" />
        {badge}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-4 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col gap-3 overflow-hidden rounded-[28px] bg-neutral-50 p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-heading-3 font-heading-3 text-default-font">
                {t('notifications.pageTitle')}
              </span>
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-caption text-brand-600 underline"
                  >
                    {t('notifications.markAllRead')}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t('notifications.close')}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white"
                >
                  <FeatherX className="h-4 w-4 text-subtext-color" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto">
              <NotificationList items={items} loading={loading} onOpen={openItem} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}