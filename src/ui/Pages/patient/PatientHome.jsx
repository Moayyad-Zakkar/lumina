import React from 'react';
import { useLoaderData } from 'react-router';
import { useTranslation } from 'react-i18next';
import { FeatherChevronsUp, FeatherChevronsDown, FeatherClock, FeatherCamera, FeatherHelpCircle, FeatherBell, FeatherEye } from '@subframe/core';


import Error from '../../components/Error';
import PatientShell from '../../components/PatientShell';
import ActionCard from '../../components/ActionCard';
import ProgressRing from '../../components/ProgressRing';
import TreatmentNoteCard from '../../components/TreatmentNoteCard';
import useArchStatusText from '../../../helper/useArchStatusText';
import { totalAligners } from '../../../helper/patientTracking';
import { PATIENT_PATHS } from '../patientPaths';
import { useReminderSync } from '../../../hooks/useReminderSync';

// Route: { path: '/patient', loader: patientTrackingLoader, element: <PatientHome /> }
/*
const ARCH_LOOK = {
  upper: { icon: <FeatherChevronsUp className="" />, bg: 'bg-[#f7ebf6]' },
  lower: { icon: <FeatherChevronsDown className="" />, bg: 'bg-[#f3f4e4]' },
};
*/
/*
const ARCH_LOOK = {
  upper: {
    icon: (
      <span
        className="h-6 w-6 shrink-0 bg-[#B45AAB]"
        style={{
          mask: 'url("/aligner-upper-color.svg") center / contain no-repeat',
          WebkitMask: 'url("/aligner-upper-color.svg") center / contain no-repeat',
        }}
        aria-hidden="true"
      />
    ),
    bg: 'bg-[#f7ebf6]',
  },
  lower: {
    icon: (
      <span
        className="h-6 w-6 shrink-0 bg-[#8A9140]"
        style={{
          mask: 'url("/aligner-lower-color.svg") center / contain no-repeat',
          WebkitMask: 'url("/aligner-lower-color.svg") center / contain no-repeat',
        }}
        aria-hidden="true"
      />
    ),
    bg: 'bg-[#f3f4e4]',
  },
};
*/
const ARCH_LOOK = {
  upper: {
    icon: (
      <img
      src="/aligner-upper-color.svg"
      alt=""
      className="h-6 w-6"
    />
    ),
    bg: 'bg-[#f7ebf6]',
  },
  lower: {
    icon: (
      <img
      src="/aligner-lower-color.svg"
      alt=""
      className="h-6 w-6"
    />
    ),
    bg: 'bg-[#f3f4e4]',
  },
};

export default function PatientHome() {
  const data = useLoaderData();
  const { t } = useTranslation();
  const statusText = useArchStatusText();
  useReminderSync();

  if (data.error) return <Error error={data.error} />;

  if (!data.caseId) {
    return (
      <PatientShell
        showLogo
        title={t('patientTracking.homeTitle')}
        subtitle={t('patientTracking.noActiveCase')}
      />
    );
  }

  const { today, arches, arch, schedule, logs, overall, instructions } = data;

  if (arches.length === 0) {
    return (
      <PatientShell
        showLogo
        title={t('patientTracking.homeTitle')}
        subtitle={t('patientTracking.noSchedule')}
      />
    );
  }

  const loggedToday = logs.some((l) => l.log_date === today);
  const pct = Math.round(overall ?? 0);

  return (
    <PatientShell showLogo title={t('patientTracking.homeTitle')}>
      {/* Overall progress = the slower arch */}
      <div className="flex w-full flex-col gap-4 rounded-[28px] bg-white p-5 shadow-sm">
        <div className="flex items-center gap-5">
          <ProgressRing pct={pct} size={116} stroke={11}>
            <span className="text-2xl font-bold text-brand-600">{pct}%</span>
          </ProgressRing>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <span className="text-body-bold text-default-font">
              {t('patientTracking.overall.title')}
            </span>
            {arches.map((a) => {
              const p = Math.round(arch[a]?.pct ?? 0);
              return (
                <div key={a} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-caption">
                    <span className="font-semibold text-default-font">
                      {t(`patientTracking.archShort.${a}`)}
                    </span>
                    <span className="text-subtext-color">{p}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-brand-600 transition-[width] duration-700"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p className="text-caption text-subtext-color">{t('patientTracking.overall.hint')}</p>
      </div>

      <TreatmentNoteCard
        notes={instructions?.notes}
        wearHours={instructions?.wear_hours_per_day}
      />

      <div className="flex w-full flex-col gap-4">
        <ActionCard
          to={PATIENT_PATHS.log}
          title={t('patientTracking.log.cardTitle')}
          subtitle={
            loggedToday
              ? t('patientTracking.log.cardDone')
              : t('patientTracking.log.cardMissing')
          }
          subtitleClassName={loggedToday ? 'text-subtext-color' : 'font-semibold text-brand-600'}
          icon={<FeatherClock className="text-[#4b4b4b]" />}
          cardClassName="bg-[#e9f0f5]"
          badge={
            loggedToday ? null : (
              <span className="h-3 w-3 flex-none rounded-full bg-[#c9cc4a]" aria-hidden />
            )
          }
        />

        {arches.map((a) => {
          const st = statusText(arch[a], totalAligners(schedule, a), today);
          return (
            <ActionCard
              key={a}
              to={PATIENT_PATHS.arch(a)}
              title={t(`patientTracking.archName.${a}`)}
              subtitle={st.text}
              subtitleClassName={st.due ? 'font-semibold text-brand-600' : 'text-subtext-color'}
              icon={ARCH_LOOK[a].icon}
              cardClassName={ARCH_LOOK[a].bg}
              badge={
                st.due ? (
                  <span className="h-3 w-3 flex-none rounded-full bg-[#c9cc4a]" aria-hidden />
                ) : null
              }
            />
          );
        })}
        <ActionCard to={PATIENT_PATHS.viewer} icon={<FeatherEye />}  cardClassName="bg-[#eaf5ee]"  title={t('patientTracking.viewer.cardTitle')}  subtitle={t('patientTracking.viewer.cardSubtitle')} />
      <ActionCard to={PATIENT_PATHS.photos} icon={<FeatherCamera />} cardClassName="bg-[#fdf1e6]" title={t('patientTracking.photos.cardTitle')} subtitle={t('patientTracking.photos.cardSubtitle')} />
      <ActionCard to={PATIENT_PATHS.help} icon={<FeatherHelpCircle />} cardClassName="bg-[#f4f4f5]" title={t('issues.cardTitle')} subtitle={t('issues.cardSubtitle')} />
      <ActionCard to={PATIENT_PATHS.reminders}  icon={<FeatherBell />}  cardClassName="bg-[#eef0fb]"  title={t('patientTracking.reminders.pageTitle')}  subtitle={t('patientTracking.reminders.cardSubtitle')} />

      </div>
    </PatientShell>
  );
}