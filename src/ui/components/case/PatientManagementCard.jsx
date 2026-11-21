import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Badge } from '../Badge';
import supabase from '../../../helper/supabaseClient';
import InvitePatientDialog from './InvitePatientDialog';
import InstructionsDialog from './InstructionsDialog';
import IssuesDialog from './IssuesDialog';
import { FeatherUserPlus, FeatherClipboard, FeatherMessageCircle } from '@subframe/core';
import { countOpenIssues } from '../../../helper/patientIssues';
import {
  ARCHES,
  addDays,
  formatDate,
  parseLocalDate,
  rowsForArch,
  toLocalISODate,
  totalAligners,
} from '../../../helper/patientTracking';

const dayDiff = (fromIso, toIso) =>
  Math.round((parseLocalDate(toIso) - parseLocalDate(fromIso)) / 86400000);

// Where is this arch relative to the doctor's schedule? Uses the arch_progress()
// row. "Overdue" = the planned switch date has passed and the patient hasn't switched.
function archState(info, today) {
  if (!info || info.current_aligner == null) return { kind: 'notStarted' };
  if (info.next_switch_on <= today && info.is_last_stage) return { kind: 'finished' };
  if (info.next_switch_on < today) {
    return { kind: 'overdue', days: dayDiff(info.next_switch_on, today) };
  }
  if (info.next_switch_on === today) return { kind: 'dueToday' };
  return { kind: 'onTrack' };
}

const BADGE_VARIANT = {
  onTrack: 'success',
  finished: 'success',
  dueToday: 'warning',
  overdue: 'warning',
  notStarted: 'neutral',
};

// Last-7-days wear time for one arch. The window never reaches back before the
// arch was first started, so "x of 7 days" isn't unfair to a new patient.
function adherence(logs, arch, firstStart, today) {
  const rows = logs.filter((l) => l.arch === arch && l.log_date >= addDays(today, -6));
  const window = Math.min(7, dayDiff(firstStart, today) + 1);
  const hours = rows.map((r) => Number(r.hours_worn));
  return {
    window,
    logged: Math.min(rows.length, window),
    avg: hours.length ? hours.reduce((s, h) => s + h, 0) / hours.length : null,
  };
}

export default function PatientManagementCard({ caseData }) {
  const { t, i18n } = useTranslation();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isIssuesOpen, setIsIssuesOpen] = useState(false);
  const [openIssues, setOpenIssues] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    const today = toLocalISODate();

    const [sched, starts, logs, ti] = await Promise.all([
      supabase
        .from('aligner_schedule')
        .select('arch, aligner_number, wear_days')
        .eq('case_id', caseData.id),
      supabase
        .from('aligner_starts')
        .select('arch, aligner_number, started_on')
        .eq('case_id', caseData.id),
      supabase
        .from('daily_wear_logs')
        .select('arch, log_date, hours_worn')
        .eq('case_id', caseData.id)
        .gte('log_date', addDays(today, -6)),
      supabase
        .from('treatment_instructions')
        .select('wear_hours_per_day')
        .eq('case_id', caseData.id)
        .maybeSingle(),
    ]);

    const failed = [sched, starts, logs, ti].find((r) => r.error);
    if (failed) {
      setError(failed.error.message);
      setLoading(false);
      return;
    }

    const present = ARCHES.filter((a) => sched.data.some((r) => r.arch === a));
    const infos = await Promise.all(
      present.map((a) =>
        supabase.rpc('arch_progress', { p_case_id: caseData.id, p_arch: a, p_today: today }),
      ),
    );
    const rpcFailed = infos.find((r) => r.error);
    if (rpcFailed) {
      setError(rpcFailed.error.message);
      setLoading(false);
      return;
    }

    setData({
      today,
      arches: present,
      schedule: sched.data,
      starts: starts.data,
      logs: logs.data,
      prescribed: ti.data?.wear_hours_per_day ?? null,
      info: Object.fromEntries(present.map((a, i) => [a, infos[i].data?.[0] ?? null])),
    });
    setLoading(false);
  };

  // Issues waiting for a reply. Failing here only hides the badge, so it never blocks the card.
  const loadIssueCount = async () => {
    try {
      setOpenIssues(await countOpenIssues(caseData.id));
    } catch {
      setOpenIssues(0);
    }
  };

  useEffect(() => {
    loadData();
    loadIssueCount();
  }, [caseData.id]);

  const lang = i18n.language;

  const renderArch = (a) => {
    const info = data.info[a];
    const total = totalAligners(data.schedule, a);
    const st = archState(info, data.today);
    const pct = Math.round(info?.pct ?? 0);
    const archStarts = rowsForArch(data.starts, a).map((s) => s.started_on).sort();
    const adh = archStarts.length ? adherence(data.logs, a, archStarts[0], data.today) : null;

    return (
      <div
        key={a}
        className="flex w-full flex-col gap-2 rounded-md border border-solid border-neutral-border px-4 py-3"
      >
        <div className="flex w-full items-center justify-between">
          <span className="text-body-bold font-body-bold text-default-font">
            {t(`scheduleEditor.arch.${a}`)}
          </span>
          <Badge variant={BADGE_VARIANT[st.kind]}>
            {t(`patientProgress.status.${st.kind}`, { days: st.days })}
          </Badge>
        </div>

        {info?.current_aligner != null && (
          <div className="flex w-full flex-col gap-1">
            <div className="flex w-full items-center justify-between">
              <span className="text-body font-body text-default-font">
                {t('patientProgress.current', { current: info.current_aligner, total })}
              </span>
              <span className="text-caption font-caption text-subtext-color">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-caption font-caption text-subtext-color">
              {t('patientProgress.startedOn', { date: formatDate(info.current_started_on, lang) })}
              {' · '}
              {info.is_last_stage
                ? t('patientProgress.finishes', { date: formatDate(info.next_switch_on, lang) })
                : t('patientProgress.nextSwitch', { date: formatDate(info.next_switch_on, lang) })}
            </span>
          </div>
        )}

        {adh && (
          <span className="text-caption font-caption text-subtext-color">
            {adh.avg == null
              ? t('patientProgress.adherenceNone')
              : t('patientProgress.adherence', {
                  avg: adh.avg.toFixed(1),
                  logged: adh.logged,
                  days: adh.window,
                })}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <span className="text-heading-3 font-heading-3 text-default-font">
          {t('casePage.patientManagement.title')}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="neutral-secondary"
            icon={<FeatherMessageCircle />}
            onClick={() => setIsIssuesOpen(true)}
          >
            {t('issues.doctorButton')}
            {openIssues > 0 && (
              <span className="ms-2 rounded-full bg-[#c9cc4a] px-2 text-caption font-caption text-default-font">
                {openIssues}
              </span>
            )}
          </Button>
          <Button
            variant="neutral-secondary"
            icon={<FeatherClipboard />}
            onClick={() => setIsInstructionsOpen(true)}
          >
            {t('casePage.instructions.title')}
          </Button>
          <Button icon={<FeatherUserPlus />} onClick={() => setIsInviteOpen(true)}>
            {t('casePage.invitePatient.title')}
          </Button>
        </div>
      </div>

      <div className="flex h-px w-full flex-none bg-neutral-border" />

      <div className="flex w-full flex-col gap-3">
        <span className="text-body-bold font-body-bold text-default-font">
          {t('casePage.patientManagement.wearPhase')}
        </span>

        {loading ? (
          <span className="text-body font-body text-subtext-color">{t('common.loading')}</span>
        ) : error ? (
          <span className="text-body font-body text-red-600">{error}</span>
        ) : data.arches.length === 0 ? (
          <span className="text-body font-body text-subtext-color">
            {t('patientProgress.noSchedule')}
          </span>
        ) : (
          <>
            {data.arches.map(renderArch)}
            {data.prescribed != null && (
              <span className="text-caption font-caption text-subtext-color">
                {t('patientProgress.prescribed', { hours: data.prescribed })}
              </span>
            )}
          </>
        )}
      </div>

      <InvitePatientDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        caseData={caseData}
        onInvited={loadData}
      />
      <IssuesDialog
        isOpen={isIssuesOpen}
        onClose={() => setIsIssuesOpen(false)}
        caseData={caseData}
        onChanged={loadIssueCount}
      />
      <InstructionsDialog
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        caseData={caseData}
        onSaved={loadData}
      />
    </div>
  );
}