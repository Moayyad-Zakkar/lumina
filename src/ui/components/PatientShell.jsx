import React from 'react';
import { Link, useOutletContext } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FeatherArrowLeft, FeatherLogOut } from '@subframe/core';
import LanguageSwitcher from './LanguageSwitcher';

// Same page chrome as RoleSelect: white page, three decorative circles,
// language switcher on top, content centred in a 420px column.
export default function PatientShell({ backTo, title, subtitle, showLogo = false, children }) {
  const { t } = useTranslation();

  // Provided by PatientLayout. Top-level pages (no back button) get a sign-out button.
  const layout = useOutletContext();
  const showSignOut = !backTo && Boolean(layout?.signOut);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-white">
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
            aria-label={t('patientTracking.back')}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <FeatherArrowLeft className="h-5 w-5 text-brand-600 rtl:rotate-180" />
          </Link>
        ) : (
          <span />
        )}

        <div className="flex items-center gap-2">
          {showSignOut && (
            <button
              type="button"
              onClick={layout.signOut}
              aria-label={t('patientTracking.signOut')}
              title={t('patientTracking.signOut')}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
            >
              <FeatherLogOut className="h-5 w-5 text-brand-600 rtl:rotate-180" />
            </button>
          )}
          <LanguageSwitcher />
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center px-6 pb-16 pt-4">
        <div className="flex w-full max-w-[420px] flex-col items-center gap-6">
          {showLogo && (
            <img className="h-20 object-contain" src="/logo.png" alt="Lumina" />
          )}

          {(title || subtitle) && (
            <div className="flex w-full flex-col items-center gap-2 text-center">
              {title && <h1 className="text-2xl font-bold text-brand-600">{title}</h1>}
              {subtitle && <p className="text-body text-subtext-color">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </div>
    </div>
  );
}