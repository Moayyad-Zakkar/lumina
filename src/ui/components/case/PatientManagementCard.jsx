import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import { Badge } from '../Badge';
import supabase from '../../../helper/supabaseClient';
import InvitePatientDialog from './InvitePatientDialog';
import InstructionsDialog from './InstructionsDialog';
import { FeatherUserPlus, FeatherClipboard } from '@subframe/core';

// Walks the doctor's aligner_schedule (from treatment_instructions) against
// how long the patient has actually been wearing aligners, to flag whether
// they're on track, ahead, or behind. Returns null if there isn't enough
// data yet to compute it (no schedule, or patient hasn't started).
function computeExpectedAligner(schedule, startedAt) {
  if (!schedule?.length || !startedAt) return null;
  const elapsedDays = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / 86400000,
  );
  let cumulative = 0;
  for (const row of [...schedule].sort(
    (a, b) => a.aligner_number - b.aligner_number,
  )) {
    cumulative += Number(row.duration_days) || 0;
    if (elapsedDays < cumulative) return row.aligner_number;
  }
  // Elapsed time exceeds the whole schedule — patient should be on the last aligner.
  return schedule[schedule.length - 1]?.aligner_number ?? null;
}

export default function PatientManagementCard({ caseData }) {
  const { t } = useTranslation();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [progress, setProgress] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    const [{ data: progressData }, { data: instructionsData }] =
      await Promise.all([
        supabase
          .from('patient_progress')
          .select('*')
          .eq('case_id', caseData.id)
          .maybeSingle(),
        supabase
          .from('treatment_instructions')
          .select('aligner_schedule')
          .eq('case_id', caseData.id)
          .maybeSingle(),
      ]);
    setProgress(progressData || null);
    setSchedule(instructionsData?.aligner_schedule || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [caseData.id]);

  const expectedAligner = progress
    ? computeExpectedAligner(schedule, progress.started_at)
    : null;

  const renderStatusBadge = () => {
    if (expectedAligner == null || !progress) return null;
    if (progress.current_aligner_number === expectedAligner) {
      return (
        <Badge variant="success">
          {t('casePage.patientManagement.onTrack')}
        </Badge>
      );
    }
    if (progress.current_aligner_number < expectedAligner) {
      return (
        <Badge variant="warning">
          {t('casePage.patientManagement.behindSchedule', {
            count: expectedAligner - progress.current_aligner_number,
          })}
        </Badge>
      );
    }
    return (
      <Badge variant="neutral">
        {t('casePage.patientManagement.aheadOfSchedule', {
          count: progress.current_aligner_number - expectedAligner,
        })}
      </Badge>
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
            icon={<FeatherClipboard />}
            onClick={() => setIsInstructionsOpen(true)}
          >
            {t('casePage.instructions.title')}
          </Button>
          <Button
            icon={<FeatherUserPlus />}
            onClick={() => setIsInviteOpen(true)}
          >
            {t('casePage.invitePatient.title')}
          </Button>
        </div>
      </div>

      <div className="flex h-px w-full flex-none bg-neutral-border" />

      <div className="flex w-full flex-col gap-2">
        <span className="text-body-bold font-body-bold text-default-font">
          {t('casePage.patientManagement.wearPhase')}
        </span>

        {loading ? (
          <span className="text-body font-body text-subtext-color">
            {t('common.loading')}
          </span>
        ) : progress ? (
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-body font-body text-default-font">
                {t('casePage.patientManagement.currentAligner', {
                  number: progress.current_aligner_number,
                })}
              </span>
              <span className="text-caption font-caption text-subtext-color">
                {t('casePage.patientManagement.startedOn', {
                  date: new Date(progress.started_at).toLocaleDateString(),
                })}
              </span>
            </div>
            {renderStatusBadge()}
          </div>
        ) : (
          <span className="text-body font-body text-subtext-color">
            {t('casePage.patientManagement.noProgressYet')}
          </span>
        )}
      </div>

      <InvitePatientDialog
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        caseData={caseData}
        onInvited={loadData}
      />
      <InstructionsDialog
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
        caseData={caseData}
      />
    </div>
  );
}
