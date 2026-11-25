// src/ui/components/NotificationList.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const UNITS = [
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

function timeAgo(iso, locale) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, secs] of UNITS) {
    if (abs >= secs) return rtf.format(Math.round(diff / secs), unit);
  }
  return rtf.format(0, 'minute'); // "this minute"
}

export default function NotificationList({ items, loading, onOpen }) {
  const { t, i18n } = useTranslation();

  if (loading) {
    return (
      <p className="w-full p-4 text-center text-caption text-subtext-color">
        {t('notifications.loading')}
      </p>
    );
  }
  if (!items.length) {
    return (
      <p className="w-full p-4 text-center text-body text-subtext-color">
        {t('notifications.empty')}
      </p>
    );
  }

  return (
    <ul className="flex w-full flex-col gap-2">
      {items.map((n) => {
        const isUnread = n.status === 'unread';
        return (
          <li key={n.id}>
            <button
              type="button"
              onClick={() => onOpen(n)}
              className={`flex w-full items-start gap-3 rounded-2xl p-3 text-start shadow-sm ${
                isUnread ? 'bg-brand-50' : 'bg-white'
              }`}
            >
              <span
                className={`mt-1.5 h-2.5 w-2.5 flex-none rounded-full ${
                  isUnread ? 'bg-brand-600' : 'bg-transparent'
                }`}
                aria-hidden
              />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-body-bold text-default-font">{n.title}</span>
                {n.body && (
                  <span className="whitespace-pre-wrap break-words text-caption text-subtext-color">
                    {n.body}
                  </span>
                )}
                <span className="text-caption text-neutral-400">
                  {timeAgo(n.created_at, i18n.language)}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}