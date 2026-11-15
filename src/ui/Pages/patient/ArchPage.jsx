import React, { useState } from 'react';
import { useLoaderData, useParams, useRevalidator } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FeatherCheck } from '@subframe/core';
import Error from '../../components/Error';
import PatientShell from '../../components/PatientShell';
import ProgressRing from '../../components/ProgressRing';

import { PATIENT_PATHS } from '../patientPaths';
import {
  ARCHES,
  addDays,
  formatDate,
  rowsForArch,
  startAligner,
  totalAligners,
  undoLastStart,
} from '../../../helper/patientTracking';
import useArchStatusText from '../../../helper/useArchStatusText';

// Route: { path: '/patient/arch/:arch', loader: patientTrackingLoader, element: <ArchPage /> }

export default function ArchPage() {
  const data = useLoaderData();
  const { arch } = useParams();
  const { t } = useTranslation();

  if (data.error) return <Error error={data.error} />;

  if (!data.caseId || !ARCHES.includes(arch) || !data.arches.includes(arch)) {
    return (
      <PatientShell
        backTo={PATIENT_PATHS.home}
        title={t('patientTracking.homeTitle')}
        subtitle={t('patientTracking.archPage.unavailable')}
      />
    );
  }

  // key resets the form state when switching between upper and lower
  return <ArchDetail key={arch} data={data} arch={arch} />;
}

const primaryBtn =
  'w-full rounded-full bg-brand-600 px-6 py-4 text-body-bold font-bold text-white shadow-sm transition-transform active:scale-[0.99] disabled:opacity-50';
const ghostBtn =
  'w-full rounded-full bg-white px-6 py-3 text-body-bold font-semibold text-brand-600 shadow-sm disabled:opacity-50';

function ArchDetail({ data, arch }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const revalidator = useRevalidator();
  const statusText = useArchStatusText();
  const { caseId, userId, today } = data;
  const p = 'patientTracking.archPage';

  const [panel, setPanel] = useState(null); // null | 'start' | 'edit'
  const [date, setDate] = useState(today);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const rows = [...rowsForArch(data.schedule, arch)].sort(
    (a, b) => a.aligner_number - b.aligner_number,
  );
  const myStarts = rowsForArch(data.starts, arch);
  const info = data.arch[arch];
  const total = totalAligners(data.schedule, arch);
  const current = info?.current_aligner ?? null;
  const nextNumber = current == null ? 1 : current + 1;
  const canAdvance = nextNumber <= total;
  const startOf = (n) => myStarts.find((s) => s.aligner_number === n)?.started_on ?? null;
  const currentStart = current ? startOf(current) : null;
  const prevStart = current && current > 1 ? startOf(current - 1) : null;
  const status = statusText(info, total, today);
  const pct = Math.round(info?.pct ?? 0);

  // Panel rules: the date can't be in the future, and can't be before the
  // previous aligner's start (start mode: before the current aligner's start).
  const panelNumber = panel === 'edit' ? current : nextNumber;
  const minDate = panel === 'edit' ? prevStart : currentStart;
  const valid = Boolean(date) && date <= today && (!minDate || date >= minDate);
  const yesterday = addDays(today, -1);

  const openPanel = (mode) => {
    setErr(null);
    setDate(mode === 'edit' ? currentStart : today);
    setPanel(mode);
  };

  const submit = async () => {
    if (!valid) {
      setErr(t(`${p}.dateInvalid`));
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await startAligner({
        caseId,
        userId,
        arch,
        alignerNumber: panelNumber,
        startedOn: date,
      });
      toast.success(t(`${p}.saved`));
      setPanel(null);
      revalidator.revalidate();
    } catch (e) {
      setErr(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  const undo = async () => {
    if (!window.confirm(t(`${p}.undoConfirm`, { n: current }))) return;
    setSaving(true);
    try {
      await undoLastStart({ caseId, arch, alignerNumber: current });
      toast.success(t(`${p}.saved`));
      revalidator.revalidate();
    } catch (e) {
      toast.error(e.message || String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PatientShell
      backTo={PATIENT_PATHS.home}
      title={t(`patientTracking.archName.${arch}`)}
    >
      {/* Where am I */}
      <div className="flex w-full items-center gap-4 rounded-[28px] bg-white p-5 shadow-sm">
        <ProgressRing pct={pct} size={100} stroke={10}>
          <span className="text-xl font-bold text-brand-600">{pct}%</span>
        </ProgressRing>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-body-bold text-default-font">
            {current
              ? t('patientTracking.status.current', { current, total })
              : t('patientTracking.status.notStarted')}
          </span>
          {currentStart && (
            <span className="text-caption text-subtext-color">
              {t(`${p}.startedOn`, { date: formatDate(currentStart, lang) })}
            </span>
          )}
          {current && (
            <span
              className={`text-caption ${
                status.due ? 'font-semibold text-brand-600' : 'text-subtext-color'
              }`}
            >
              {status.short}
            </span>
          )}
        </div>
      </div>

      {/* Start / switch */}
      {!panel && (
        <div className="flex w-full flex-col gap-3">
          {canAdvance && (
            <button type="button" className={primaryBtn} onClick={() => openPanel('start')}>
              {current == null
                ? t(`${p}.start`, { n: 1 })
                : t(`${p}.switch`, { n: nextNumber })}
            </button>
          )}
          {current != null && (
            <button type="button" className={ghostBtn} onClick={() => openPanel('edit')}>
              {t(`${p}.changeDate`)}
            </button>
          )}
          {current != null && (
            <button
              type="button"
              disabled={saving}
              onClick={undo}
              className="text-caption text-subtext-color underline"
            >
              {t(`${p}.undo`)}
            </button>
          )}
        </div>
      )}

      {panel && (
        <div className="flex w-full flex-col gap-3 rounded-[28px] border border-solid border-neutral-border bg-white p-5 shadow-sm">
          <span className="text-body-bold text-brand-600">
            {t(`${p}.dateLabel`, { n: panelNumber })}
          </span>
          <input
            type="date"
            value={date || ''}
            min={minDate || undefined}
            max={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-2xl border border-solid border-neutral-border px-4 py-3 text-body"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDate(today)}
              className="rounded-full bg-neutral-100 px-4 py-2 text-caption"
            >
              {t(`${p}.today`)}
            </button>
            {(!minDate || yesterday >= minDate) && (
              <button
                type="button"
                onClick={() => setDate(yesterday)}
                className="rounded-full bg-neutral-100 px-4 py-2 text-caption"
              >
                {t(`${p}.yesterday`)}
              </button>
            )}
          </div>
          {err && <span className="text-caption text-red-600">{err}</span>}
          <div className="flex gap-3">
            <button
              type="button"
              className={ghostBtn}
              disabled={saving}
              onClick={() => setPanel(null)}
            >
              {t(`${p}.cancel`)}
            </button>
            <button type="button" className={primaryBtn} disabled={!valid || saving} onClick={submit}>
              {t(`${p}.confirm`)}
            </button>
          </div>
        </div>
      )}

      {/* All aligners */}
      <div className="flex w-full flex-col gap-2">
        <span className="text-body-bold text-brand-600">{t(`${p}.timeline`)}</span>
        {rows.map((r) => {
          const n = r.aligner_number;
          const start = startOf(n);
          const state =
            current == null || n > current ? 'upcoming' : n < current ? 'done' : 'current';
          return (
            <div
              key={n}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                state === 'current' ? 'bg-[#f7ebf6]' : 'bg-white shadow-sm'
              }`}
            >
              <div
                className={`flex h-9 w-9 flex-none items-center justify-center rounded-full text-body-bold ${
                  state === 'done'
                    ? 'bg-brand-600 text-white'
                    : state === 'current'
                      ? 'bg-white text-brand-600'
                      : 'bg-neutral-100 text-subtext-color'
                }`}
              >
                {state === 'done' ? <FeatherCheck className="h-4 w-4" /> : n}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="text-body text-default-font">
                  {t(`${p}.wearDays`, { days: r.wear_days })}
                </span>
                {start && (
                  <span className="text-caption text-subtext-color">
  {formatDate(start, lang)}{" "}
  <span className="inline-block [transform:scaleX(-1)]">→</span>{" "}
  {formatDate(addDays(start, r.wear_days), lang)}
</span>
                )}
              </div>
              <span className="text-caption text-subtext-color">{t(`${p}.${state}`)}</span>
            </div>
          );
        })}
      </div>
    </PatientShell>
  );
}