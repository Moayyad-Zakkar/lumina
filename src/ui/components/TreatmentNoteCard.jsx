import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherClock } from '@subframe/core';

// The doctor's standing instructions: prescribed wear time + a free-text note.
// Shown on the patient home. Renders nothing when the doctor wrote neither.
const COLLAPSE_AT_CHARS = 160;
const COLLAPSE_AT_LINES = 4;

export default function TreatmentNoteCard({ notes, wearHours }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const note = (notes || '').trim();
  const hours = Number(wearHours);
  const hasHours = Number.isFinite(hours) && hours > 0;
  if (!note && !hasHours) return null;

  const long = note.length > COLLAPSE_AT_CHARS || note.split('\n').length > COLLAPSE_AT_LINES;

  return (
    <div className="flex w-full flex-col gap-3 rounded-[28px] bg-white p-5 shadow-sm">
      <span className="text-body-bold text-default-font">{t('patientTracking.note.title')}</span>

      {hasHours && (
        <div className="flex items-center gap-3 rounded-2xl bg-[#e9f0f5] px-4 py-3">
          <FeatherClock className="h-5 w-5 flex-none text-[#4b4b4b]" />
          <span className="text-body text-default-font">
            {t('patientTracking.note.wearHours', { hours })}
          </span>
        </div>
      )}

      {note && (
        <>
          {/* pre-wrap keeps the doctor's line breaks (numbered points, paragraphs) */}
          <p
            dir="auto"
            className={`whitespace-pre-wrap break-words text-body text-default-font ${
              long && !expanded ? 'line-clamp-3' : ''
            }`}
          >
            {note}
          </p>
          {long && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              className="self-start text-caption font-semibold text-brand-600"
            >
              {expanded ? t('patientTracking.note.less') : t('patientTracking.note.more')}
            </button>
          )}
        </>
      )}
    </div>
  );
}