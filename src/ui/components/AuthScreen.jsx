import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FeatherChevronLeft } from '@subframe/core';
import LanguageSwitcher from './LanguageSwitcher';

// Shared chrome for the role picker and both sign-in pages. The logo lives
// outside the scrolling content so it stays in the same place when navigating
// between those screens.
export default function AuthScreen({ backTo, backLabel, children }) {
  const { t } = useTranslation();

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-white">
      <div
        className="pointer-events-none absolute -start-20 -top-20 h-36 w-36 rounded-full bg-[#c9cc4a]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -end-16 h-56 w-56 rounded-full bg-brand-600"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -end-28 h-40 w-40 rounded-full bg-[#c9cc4a]"
        aria-hidden
      />

      <div className="relative z-20 flex items-center justify-between px-4 pt-4">
        {backTo ? (
          <Link
            to={backTo}
            aria-label={backLabel}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-brand-600 shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <FeatherChevronLeft className="h-5 w-5 rtl:rotate-180" />
          </Link>
        ) : (
          <span className="h-10 w-10" aria-hidden />
        )}
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 flex shrink-0 justify-center px-6 pt-2">
        <img className="h-24 object-contain" src="/logo.png" alt="Lumina" />
      </div>

      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full flex-col items-center justify-center px-6 py-6">
          {children}
        </div>
      </div>

      <p className="relative z-10 shrink-0 pb-8 text-center text-sm text-neutral-400">
        {t('roleSelect.footer')}
      </p>
    </div>
  );
}
