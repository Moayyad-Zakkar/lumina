import React from 'react';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FeatherChevronRight } from '@subframe/core';
import AuthScreen from '../components/AuthScreen';

function RoleCard({ to, title, subtitle, iconSrc, iconAlt, cardClassName }) {
  return (
    <Link
      to={to}
      className={`flex w-full items-center gap-4 rounded-[28px] px-5 py-4 shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.99] ${cardClassName}`}
    >
      <div className="flex h-16 w-16 flex-none items-center justify-center">
        <img src={iconSrc} alt={iconAlt} className="h-full w-full object-contain" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start gap-1">
        <span className="w-full text-xl font-bold text-brand-600">{title}</span>
        <span className="w-full text-body text-subtext-color">{subtitle}</span>
      </div>
      <FeatherChevronRight className="h-5 w-5 flex-none text-neutral-400 rtl:rotate-180" />
    </Link>
  );
}

function RoleSelect() {
  const { t } = useTranslation();

  return (
    <AuthScreen>
      <div className="flex w-full max-w-[420px] flex-col items-center gap-10">
        <div className="flex w-full flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-brand-600">{t('roleSelect.title')}</h1>
          <p className="text-body text-subtext-color">{t('roleSelect.subtitle')}</p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <RoleCard
            to="/login"
            title={t('roleSelect.doctorTitle')}
            subtitle={t('roleSelect.doctorSubtitle')}
            iconSrc="/doctor-icon.png"
            iconAlt={t('roleSelect.doctorTitle')}
            iconClassName="h-full w-full object-cover scale-[1.35]"
            cardClassName="bg-[#f7ebf6]"
          />
          <RoleCard
            to="/patient-login"
            title={t('roleSelect.patientTitle')}
            subtitle={t('roleSelect.patientSubtitle')}
            iconSrc="/patient-icon.png"
            iconAlt={t('roleSelect.patientTitle')}
            iconClassName="h-full w-full object-cover scale-[1.35]"
            cardClassName="bg-[#f3f4e4]"
          />
        </div>
      </div>
    </AuthScreen>
  );
}

export default RoleSelect;
