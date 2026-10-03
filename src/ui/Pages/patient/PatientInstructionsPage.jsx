import React, { useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { useTranslation } from 'react-i18next';
import supabase from '../../../helper/supabaseClient';
import { Button } from '../../components/Button';

const PatientInstructionsPage = () => {
  const { t } = useTranslation();
  const { caseId, instructions, progress } = useLoaderData();
  const revalidator = useRevalidator();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const totalAligners = instructions?.aligner_schedule?.length || 0;

  const startTreatment = async () => {
    setSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error: upsertError } = await supabase
        .from('patient_progress')
        .upsert(
          {
            case_id: caseId,
            patient_id: user.id,
            current_aligner_number: 1,
            started_at: new Date().toISOString(),
          },
          { onConflict: 'case_id' },
        );
      if (upsertError) throw upsertError;
      revalidator.revalidate();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const advanceAligner = async () => {
    setSaving(true);
    setError(null);
    try {
      // Only current_aligner_number changes here — started_at is deliberately
      // left untouched so the doctor's on-track/behind comparison stays accurate.
      const { error: updateError } = await supabase
        .from('patient_progress')
        .update({
          current_aligner_number: progress.current_aligner_number + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('case_id', caseId);
      if (updateError) throw updateError;
      revalidator.revalidate();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!caseId) {
    return (
      <div className="flex w-full flex-col gap-2">
        <h1 className="text-heading-2 font-heading-2 text-default-font">
          {t('patientHome.title')}
        </h1>
        <span className="text-body font-body text-subtext-color">
          {t('patientHome.noActiveCase')}
        </span>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <h1 className="text-heading-2 font-heading-2 text-default-font">
        {t('patientHome.title')}
      </h1>

      {error && (
        <div className="rounded-md bg-red-50 w-full p-4">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      )}

      <div className="flex w-full flex-col gap-2 rounded-md border border-solid border-neutral-border p-4">
        <span className="text-body-bold font-body-bold text-default-font">
          {t('patientHome.instructions')}
        </span>
        {instructions?.notes ? (
          <p className="text-body font-body text-default-font whitespace-pre-wrap">
            {instructions.notes}
          </p>
        ) : (
          <span className="text-body font-body text-subtext-color">
            {t('patientHome.noInstructionsYet')}
          </span>
        )}
        {instructions?.wear_hours_per_day && (
          <span className="text-caption font-caption text-subtext-color">
            {t('patientHome.wearHoursPerDay', {
              hours: instructions.wear_hours_per_day,
            })}
          </span>
        )}
      </div>

      <div className="flex w-full flex-col gap-3 rounded-md border border-solid border-neutral-border p-4">
        <span className="text-body-bold font-body-bold text-default-font">
          {t('patientHome.wearPhase')}
        </span>

        {progress ? (
          <>
            <span className="text-body font-body text-default-font">
              {t('patientHome.currentAligner', {
                number: progress.current_aligner_number,
                total: totalAligners || '?',
              })}
            </span>
            <span className="text-caption font-caption text-subtext-color">
              {t('patientHome.startedOn', {
                date: new Date(progress.started_at).toLocaleDateString(),
              })}
            </span>
            {totalAligners > 0 &&
              progress.current_aligner_number < totalAligners && (
                <Button onClick={advanceAligner} disabled={saving}>
                  {t('patientHome.movedToNext')}
                </Button>
              )}
          </>
        ) : (
          <>
            <span className="text-body font-body text-subtext-color">
              {t('patientHome.notStartedYet')}
            </span>
            <Button onClick={startTreatment} disabled={saving}>
              {t('patientHome.startTreatment')}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PatientInstructionsPage;
