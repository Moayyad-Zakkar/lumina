import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '../Dialog';
import { Button } from '../Button';
import Error from '../Error';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';
import { FeatherSave } from '@subframe/core';

const DEFAULT_DURATION_DAYS = 14;

export default function InstructionsDialog({ isOpen, onClose, caseData }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [wearHoursPerDay, setWearHoursPerDay] = useState(22);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Total aligner steps: assumes upper/lower are switched together, per arch counts on the case.
  const totalAligners = useMemo(() => {
    const upper = Number(caseData?.upper_jaw_aligners) || 0;
    const lower = Number(caseData?.lower_jaw_aligners) || 0;
    return Math.max(upper, lower);
  }, [caseData]);

  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('treatment_instructions')
        .select('*')
        .eq('case_id', caseData.id)
        .maybeSingle();

      if (fetchError) {
        setError(fetchError.message);
      } else if (data) {
        setNotes(data.notes || '');
        setWearHoursPerDay(data.wear_hours_per_day ?? 22);
        setSchedule(
          data.aligner_schedule?.length
            ? data.aligner_schedule
            : buildDefaultSchedule(totalAligners),
        );
      } else {
        setSchedule(buildDefaultSchedule(totalAligners));
      }
      setLoading(false);
    };
    load();
  }, [isOpen, caseData.id, totalAligners]);

  const updateDuration = (alignerNumber, value) => {
    setSchedule((prev) =>
      prev.map((row) =>
        row.aligner_number === alignerNumber
          ? { ...row, duration_days: Number(value) || 0 }
          : row,
      ),
    );
  };

  const applyToAll = (value) => {
    setSchedule((prev) =>
      prev.map((row) => ({ ...row, duration_days: Number(value) || 0 })),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: upsertError } = await supabase
        .from('treatment_instructions')
        .upsert(
          {
            case_id: caseData.id,
            created_by: user.id,
            notes,
            wear_hours_per_day: wearHoursPerDay,
            aligner_schedule: schedule,
          },
          { onConflict: 'case_id' },
        );
      if (upsertError) throw upsertError;

      toast.success(t('casePage.instructions.saved'));
      onClose();
    } catch (e) {
      setError(e.message || t('casePage.instructions.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content className="w-full max-w-lg p-6">
        <div className="flex w-full flex-col gap-4">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {t('casePage.instructions.title')}
          </span>

          {error && <Error error={error} />}

          {loading ? (
            <span className="text-body font-body text-subtext-color">
              {t('common.loading')}
            </span>
          ) : (
            <>
              <div className="flex w-full flex-col gap-1">
                <span className="text-caption font-caption text-subtext-color">
                  {t('casePage.instructions.notes')}
                </span>
                <textarea
                  className="w-full min-h-24 rounded-md border border-solid border-neutral-border px-3 py-2 text-body font-body"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="flex w-full items-center gap-2">
                <span className="text-caption font-caption text-subtext-color">
                  {t('casePage.instructions.wearHoursPerDay')}
                </span>
                <input
                  type="number"
                  className="w-20 rounded-md border border-solid border-neutral-border px-2 py-1 text-body font-body"
                  value={wearHoursPerDay}
                  onChange={(e) => setWearHoursPerDay(Number(e.target.value))}
                />
              </div>

              <div className="flex h-px w-full flex-none bg-neutral-border" />

              <div className="flex w-full items-center justify-between">
                <span className="text-body-bold font-body-bold text-default-font">
                  {t('casePage.instructions.schedule')} ({totalAligners})
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-caption font-caption text-subtext-color">
                    {t('casePage.instructions.applyToAll')}
                  </span>
                  <input
                    type="number"
                    className="w-16 rounded-md border border-solid border-neutral-border px-2 py-1 text-body font-body"
                    defaultValue={DEFAULT_DURATION_DAYS}
                    onBlur={(e) => applyToAll(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 max-h-64 overflow-y-auto">
                {schedule.map((row) => (
                  <div
                    key={row.aligner_number}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="text-body font-body text-default-font">
                      {t('casePage.instructions.aligner')} #{row.aligner_number}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        className="w-20 rounded-md border border-solid border-neutral-border px-2 py-1 text-body font-body"
                        value={row.duration_days}
                        onChange={(e) =>
                          updateDuration(row.aligner_number, e.target.value)
                        }
                      />
                      <span className="text-caption font-caption text-subtext-color">
                        {t('casePage.instructions.days')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex w-full justify-end gap-2 pt-2">
                <Button
                  variant="neutral-secondary"
                  onClick={onClose}
                  disabled={saving}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  icon={<FeatherSave />}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? t('casePage.instructions.saving')
                    : t('common.save')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}

function buildDefaultSchedule(total) {
  return Array.from({ length: total }, (_, i) => ({
    aligner_number: i + 1,
    duration_days: DEFAULT_DURATION_DAYS,
  }));
}
