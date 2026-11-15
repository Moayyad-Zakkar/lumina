import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLoaderData, useRevalidator } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FeatherMinus, FeatherPlus } from '@subframe/core';
import Error from '../../components/Error';
import PatientShell from '../../components/PatientShell';
import { PATIENT_PATHS } from '../patientPaths';
import {
  addDays,
  alignerOnDate,
  firstStartDate,
  formatDate,
  saveWearHours,
} from '../../../helper/patientTracking';

// Route: { path: '/patient/log', loader: patientTrackingLoader, element: <DailyLogPage /> }

const DAYS_BACK = 14;
const QUICK_PICKS = [0, 8, 12, 16, 20, 22];
const DEFAULT_START = 16; // first tap on +/- when nothing is chosen yet

// Module-scope on purpose: components defined inside another component's render
// remount on every state change.
function HoursStepper({ value, onChange, label }) {
  const { t } = useTranslation();
  const set = (v) => onChange(Math.max(0, Math.min(24, Math.round(v * 2) / 2)));
  const step = (delta) => set(value == null ? DEFAULT_START : value + delta);

  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-[28px] bg-white px-5 py-5 shadow-sm">
      {label && <span className="text-body-bold text-brand-600">{label}</span>}

      <div className="flex w-full items-center justify-between">
        <button
          type="button"
          onClick={() => step(-0.5)}
          aria-label="-0.5"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 active:scale-95"
        >
          <FeatherMinus className="h-5 w-5 text-brand-600" />
        </button>

        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold tabular-nums text-brand-600">
            {value == null ? '–' : value}
          </span>
          <span className="text-body text-subtext-color">{t('patientTracking.log.unit')}</span>
        </div>

        <button
          type="button"
          onClick={() => step(0.5)}
          aria-label="+0.5"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 active:scale-95"
        >
          <FeatherPlus className="h-5 w-5 text-brand-600" />
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {QUICK_PICKS.map((h) => (
          <button
            key={h}
            type="button"
            onClick={() => onChange(h)}
            className={`min-w-[44px] rounded-full px-3 py-2 text-body-bold ${
              value === h ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-default-font'
            }`}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function DailyLogPage() {
  const data = useLoaderData();
  const { t } = useTranslation();

  if (data.error) return <Error error={data.error} />;

  if (!data.caseId) {
    return (
      <PatientShell
        backTo={PATIENT_PATHS.home}
        title={t('patientTracking.log.pageTitle')}
        subtitle={t('patientTracking.noActiveCase')}
      />
    );
  }

  if (data.starts.length === 0) {
    return (
      <PatientShell
        backTo={PATIENT_PATHS.home}
        title={t('patientTracking.log.pageTitle')}
        subtitle={t('patientTracking.log.startFirst')}
      >
        {data.arches[0] && (
          <Link
            to={PATIENT_PATHS.arch(data.arches[0])}
            className="w-full rounded-full bg-brand-600 px-6 py-4 text-center text-body-bold font-bold text-white shadow-sm"
          >
            {t('patientTracking.log.goStart')}
          </Link>
        )}
      </PatientShell>
    );
  }

  return <LogForm data={data} />;
}

function LogForm({ data }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const revalidator = useRevalidator();
  const { caseId, userId, today, starts, logs, arches } = data;

  const first = useMemo(() => firstStartDate(starts), [starts]);
  const [selected, setSelected] = useState(today);
  const [separate, setSeparate] = useState(false);
  const [shared, setShared] = useState(null);
  const [perArch, setPerArch] = useState({});
  const [saving, setSaving] = useState(false);

  // Last 14 days, but never before the first aligner was started.
  const days = useMemo(() => {
    const list = [];
    for (let i = 0; i < DAYS_BACK; i += 1) {
      const d = addDays(today, -i);
      if (first && d < first) break;
      list.push(d);
    }
    return list;
  }, [today, first]);

  // { '2026-10-20': { upper: 16, lower: 16 } }
  const byDate = useMemo(() => {
    const m = {};
    for (const l of logs) {
      if (!m[l.log_date]) m[l.log_date] = {};
      m[l.log_date][l.arch] = Number(l.hours_worn);
    }
    return m;
  }, [logs]);

  // Arches that had an aligner in place on the selected day.
  const loggable = useMemo(
    () => arches.filter((a) => alignerOnDate(starts, a, selected) != null),
    [arches, starts, selected],
  );

  // Load what's already saved for the selected day (blank if nothing: no prefilled hours).
  useEffect(() => {
    const existing = byDate[selected] || {};
    const vals = loggable.map((a) => existing[a]).filter((v) => v != null);
    if (vals.length === 0) {
      setShared(null);
      setPerArch({});
      setSeparate(false);
      return;
    }
    setShared(vals[0]);
    setPerArch(existing);
    setSeparate(loggable.length > 1 && !vals.every((v) => v === vals[0]));
  }, [selected, byDate, loggable]);

  const toggleSeparate = (on) => {
    if (on) {
      setPerArch(Object.fromEntries(loggable.map((a) => [a, perArch[a] ?? shared])));
    } else {
      setShared(perArch[loggable[0]] ?? shared);
    }
    setSeparate(on);
  };

  const values = separate ? loggable.map((a) => perArch[a]) : [shared];
  const canSave = loggable.length > 0 && values.every((v) => v != null) && !saving;
  const loggedCount = days.filter((d) => byDate[d]).length;

  const onSave = async () => {
    setSaving(true);
    try {
      await saveWearHours({
        caseId,
        userId,
        date: selected,
        entries: loggable.map((a) => ({
          arch: a,
          alignerNumber: alignerOnDate(starts, a, selected),
          hours: separate ? perArch[a] : shared,
        })),
      });
      toast.success(t('patientTracking.log.saved'));
      revalidator.revalidate();
    } catch (e) {
      toast.error(e.message || t('patientTracking.log.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PatientShell backTo={PATIENT_PATHS.home} title={t('patientTracking.log.pageTitle')}>
      {/* Day picker */}
      <div className="flex w-full flex-col gap-2">
        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1">
          {days.map((d) => {
            const active = d === selected;
            const logged = Boolean(byDate[d]);
            return (
              <button
                key={d}
                type="button"
                aria-pressed={active}
                onClick={() => setSelected(d)}
                className={`flex w-14 flex-none flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-colors ${
                  active ? 'bg-brand-600 text-white' : 'bg-white text-default-font shadow-sm'
                }`}
              >
                <span className="text-caption">{formatDate(d, lang, { weekday: 'short' })}</span>
                <span className="text-body-bold">{formatDate(d, lang, { day: 'numeric' })}</span>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    logged ? (active ? 'bg-white' : 'bg-brand-600') : 'bg-[#c9cc4a]'
                  }`}
                />
                <span className="sr-only">
                  {logged ? t('patientTracking.log.chipLogged') : t('patientTracking.log.chipMissing')}
                </span>
              </button>
            );
          })}
        </div>
        <span className="text-caption text-subtext-color">
          {t('patientTracking.log.summary', { done: loggedCount, total: days.length })}
        </span>
      </div>

      <p className="w-full text-center text-body text-default-font">
        {t('patientTracking.log.question', {
          date:
            selected === today
              ? t('patientTracking.log.today')
              : formatDate(selected, lang, { weekday: 'long', day: 'numeric', month: 'long' }),
        })}
      </p>

      {/* Hours input: one for both arches by default */}
      {separate ? (
        loggable.map((a) => (
          <HoursStepper
            key={a}
            label={t(`patientTracking.archName.${a}`)}
            value={perArch[a] ?? null}
            onChange={(v) => setPerArch((prev) => ({ ...prev, [a]: v }))}
          />
        ))
      ) : (
        <HoursStepper value={shared} onChange={setShared} />
      )}

      {loggable.length > 1 && (
        <label className="flex w-full items-center gap-3 text-body text-default-font">
          <input
            type="checkbox"
            checked={separate}
            onChange={(e) => toggleSeparate(e.target.checked)}
            className="h-5 w-5 accent-brand-600"
          />
          {t('patientTracking.log.separate')}
        </label>
      )}

      <button
        type="button"
        disabled={!canSave}
        onClick={onSave}
        className="w-full rounded-full bg-brand-600 px-6 py-4 text-body-bold font-bold text-white shadow-sm transition-transform active:scale-[0.99] disabled:opacity-50"
      >
        {t('patientTracking.log.save')}
      </button>

      <p className="text-center text-caption text-subtext-color">
        {t('patientTracking.log.editHint')}
      </p>
    </PatientShell>
  );
}