import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '../Dialog';
import { Button } from '../Button';
import Error from '../Error';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';
import { FeatherSave, FeatherPlus, FeatherMinus, FeatherCopy } from '@subframe/core';
import { ARCHES, formatDate, rowsForArch } from '../../../helper/patientTracking';
import {
  DEFAULT_WEAR_DAYS,
  MAX_WEAR_DAYS,
  addAligner,
  buildArchRows,
  copyDurations,
  diffRows,
  removeLast,
  toPayload,
  validateRows,
} from '../../../helper/scheduleEditor';

const inputClass =
  'w-20 rounded-md border border-solid border-neutral-border px-2 py-1 text-body font-body';

// Module scope on purpose: a component defined inside another component's render
// remounts on every keystroke and loses input focus.
function ArchEditor({
  rows,
  original,
  startedOn,
  maxStarted,
  copyFromLabel,
  onUpdateDays,
  onApplyAll,
  onCopy,
  onAdd,
  onRemove,
}) {
  const { t, i18n } = useTranslation();
  const [bulk, setBulk] = useState(String(DEFAULT_WEAR_DAYS));
  const originalDays = new Map(original.map((r) => [r.aligner_number, r.wear_days]));
  const last = rows[rows.length - 1];
  const lastLocked = !last || last.aligner_number <= maxStarted;

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-wrap items-center gap-2">
        <span className="text-caption font-caption text-subtext-color">
          {t('casePage.instructions.applyToAll')}
        </span>
        <input
          type="number"
          min={1}
          max={MAX_WEAR_DAYS}
          className="w-16 rounded-md border border-solid border-neutral-border px-2 py-1 text-body font-body"
          value={bulk}
          onChange={(e) => setBulk(e.target.value)}
        />
        <Button
          variant="neutral-secondary"
          size="small"
          onClick={() => onApplyAll(Number(bulk))}
          disabled={!Number.isInteger(Number(bulk)) || Number(bulk) < 1}
        >
          {t('scheduleEditor.apply')}
        </Button>
        {copyFromLabel && (
          <Button variant="neutral-secondary" size="small" icon={<FeatherCopy />} onClick={onCopy}>
            {copyFromLabel}
          </Button>
        )}
      </div>

      <div className="flex w-full max-h-64 flex-col gap-2 overflow-y-auto">
        {rows.map((row) => {
          const started = startedOn[row.aligner_number];
          const changed = originalDays.has(row.aligner_number)
            ? originalDays.get(row.aligner_number) !== row.wear_days
            : true;
          return (
            <div
              key={row.aligner_number}
              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 ${
                changed ? 'bg-neutral-50' : ''
              }`}
            >
              <div className="flex flex-col">
                <span className="text-body font-body text-default-font">
                  {t('casePage.instructions.aligner')} #{row.aligner_number}
                </span>
                {started && (
                  <span className="text-caption font-caption text-subtext-color">
                    {t('scheduleEditor.startedOn', { date: formatDate(started, i18n.language) })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={MAX_WEAR_DAYS}
                  className={inputClass}
                  value={row.wear_days}
                  onChange={(e) =>
                    onUpdateDays(
                      row.aligner_number,
                      e.target.value === '' ? '' : Number(e.target.value),
                    )
                  }
                />
                <span className="text-caption font-caption text-subtext-color">
                  {t('casePage.instructions.days')}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex w-full items-center gap-2">
        <Button variant="neutral-secondary" size="small" icon={<FeatherPlus />} onClick={onAdd}>
          {t('scheduleEditor.add')}
        </Button>
        <Button
          variant="neutral-secondary"
          size="small"
          icon={<FeatherMinus />}
          onClick={onRemove}
          disabled={lastLocked}
          title={lastLocked && last ? t('scheduleEditor.startedLocked') : undefined}
        >
          {t('scheduleEditor.removeLast')}
        </Button>
      </div>
    </div>
  );
}

export default function InstructionsDialog({ isOpen, onClose, caseData, onSaved }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [wearHoursPerDay, setWearHoursPerDay] = useState(22);
  const [arches, setArches] = useState([]);
  const [activeArch, setActiveArch] = useState('upper');
  const [original, setOriginal] = useState({ upper: [], lower: [] });
  const [schedule, setSchedule] = useState({ upper: [], lower: [] });
  const [startedOn, setStartedOn] = useState({ upper: {}, lower: {} });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const upperCount = Number(caseData?.upper_jaw_aligners) || 0;
  const lowerCount = Number(caseData?.lower_jaw_aligners) || 0;

  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      setReason('');

      const [ti, sched, starts] = await Promise.all([
        supabase
          .from('treatment_instructions')
          .select('notes, wear_hours_per_day, aligner_schedule')
          .eq('case_id', caseData.id)
          .maybeSingle(),
        supabase
          .from('aligner_schedule')
          .select('arch, aligner_number, wear_days')
          .eq('case_id', caseData.id),
        supabase
          .from('aligner_starts')
          .select('arch, aligner_number, started_on')
          .eq('case_id', caseData.id),
      ]);
      if (cancelled) return;

      const failed = [ti, sched, starts].find((r) => r.error);
      if (failed) {
        setError(failed.error.message);
        setLoading(false);
        return;
      }

      const counts = { upper: upperCount, lower: lowerCount };
      const rows = {};
      const started = {};
      for (const a of ARCHES) {
        rows[a] = buildArchRows({
          dbRows: rowsForArch(sched.data, a),
          legacy: ti.data?.aligner_schedule,
          count: counts[a],
        });
        started[a] = Object.fromEntries(
          rowsForArch(starts.data, a).map((s) => [s.aligner_number, s.started_on]),
        );
      }
      const shown = ARCHES.filter((a) => rows[a].length > 0);

      setNotes(ti.data?.notes || '');
      setWearHoursPerDay(ti.data?.wear_hours_per_day ?? 22);
      setOriginal(rows);
      setSchedule(rows);
      setStartedOn(started);
      setArches(shown);
      setActiveArch(shown[0] || 'upper');
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, caseData.id, upperCount, lowerCount]);

  const setArchRows = (arch, fn) =>
    setSchedule((prev) => ({ ...prev, [arch]: fn(prev[arch]) }));

  const hasStarted = ARCHES.some((a) => Object.keys(startedOn[a]).length > 0);
  const maxStarted = (a) => Math.max(0, ...Object.keys(startedOn[a]).map(Number));
  const diffs = Object.fromEntries(ARCHES.map((a) => [a, diffRows(original[a], schedule[a])]));
  const dirty = arches.some((a) => diffs[a].count > 0);
  const valid = arches.every((a) => validateRows(schedule[a]));
  const needsReason = hasStarted && dirty;
  const canSave = !saving && !loading && valid && (!needsReason || reason.trim().length > 0);
  const otherArch = ARCHES.find((a) => a !== activeArch);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Atomic on the database side; also writes the audit log and enforces the rules.
      if (dirty) {
        const { error: rpcError } = await supabase.rpc('save_aligner_schedule', {
          p_case_id: caseData.id,
          p_schedule: toPayload(schedule, arches),
          p_reason: reason.trim() || null,
        });
        if (rpcError) throw rpcError;
      }

      // Notes + prescribed hours stay on treatment_instructions.
      // aligner_schedule (old jsonb) is left alone: the per-arch table replaces it.
      const { error: upsertError } = await supabase.from('treatment_instructions').upsert(
        {
          case_id: caseData.id,
          created_by: user.id,
          notes,
          wear_hours_per_day: wearHoursPerDay,
        },
        { onConflict: 'case_id' },
      );
      if (upsertError) throw upsertError;

      toast.success(t('casePage.instructions.saved'));
      if (onSaved) onSaved();
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
            <span className="text-body font-body text-subtext-color">{t('common.loading')}</span>
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
                  className={inputClass}
                  value={wearHoursPerDay}
                  onChange={(e) => setWearHoursPerDay(Number(e.target.value))}
                />
              </div>

              <div className="flex h-px w-full flex-none bg-neutral-border" />

              <span className="text-body-bold font-body-bold text-default-font">
                {t('casePage.instructions.schedule')}
              </span>

              {arches.length === 0 ? (
                <span className="text-body font-body text-subtext-color">
                  {t('scheduleEditor.noArches')}
                </span>
              ) : (
                <>
                  <div className="flex w-full gap-2">
                    {arches.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => setActiveArch(a)}
                        className={`flex-1 rounded-md px-3 py-2 text-body-bold font-body-bold ${
                          a === activeArch
                            ? 'bg-brand-600 text-white'
                            : 'bg-neutral-100 text-default-font'
                        }`}
                      >
                        {t(`scheduleEditor.arch.${a}`)} ({schedule[a].length})
                      </button>
                    ))}
                  </div>

                  <ArchEditor
                    key={activeArch}
                    rows={schedule[activeArch]}
                    original={original[activeArch]}
                    startedOn={startedOn[activeArch]}
                    maxStarted={maxStarted(activeArch)}
                    copyFromLabel={
                      arches.length > 1
                        ? t('scheduleEditor.copyFrom', {
                            arch: t(`scheduleEditor.arch.${otherArch}`),
                          })
                        : null
                    }
                    onUpdateDays={(n, v) =>
                      setArchRows(activeArch, (rows) =>
                        rows.map((r) => (r.aligner_number === n ? { ...r, wear_days: v } : r)),
                      )
                    }
                    onApplyAll={(v) =>
                      setArchRows(activeArch, (rows) => rows.map((r) => ({ ...r, wear_days: v })))
                    }
                    onCopy={() =>
                      setArchRows(activeArch, (rows) => copyDurations(schedule[otherArch], rows))
                    }
                    onAdd={() => setArchRows(activeArch, addAligner)}
                    onRemove={() => setArchRows(activeArch, removeLast)}
                  />

                  {!valid && (
                    <span className="text-caption font-caption text-red-600">
                      {t('scheduleEditor.invalid')}
                    </span>
                  )}

                  {dirty && (
                    <span className="text-caption font-caption text-subtext-color">
                      {t('scheduleEditor.changes', {
                        n: arches.reduce((sum, a) => sum + diffs[a].count, 0),
                      })}
                    </span>
                  )}

                  {needsReason && (
                    <div className="flex w-full flex-col gap-1">
                      <span className="text-caption font-caption text-subtext-color">
                        {t('scheduleEditor.reasonLabel')}
                      </span>
                      <textarea
                        className="w-full min-h-16 rounded-md border border-solid border-neutral-border px-3 py-2 text-body font-body"
                        placeholder={t('scheduleEditor.reasonPlaceholder')}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <span className="text-caption font-caption text-subtext-color">
                        {t('scheduleEditor.reasonHint')}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex w-full justify-end gap-2 pt-2">
                <Button variant="neutral-secondary" onClick={onClose} disabled={saving}>
                  {t('common.cancel')}
                </Button>
                <Button icon={<FeatherSave />} onClick={handleSave} disabled={!canSave}>
                  {saving ? t('casePage.instructions.saving') : t('common.save')}
                </Button>
              </div>
            </>
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}