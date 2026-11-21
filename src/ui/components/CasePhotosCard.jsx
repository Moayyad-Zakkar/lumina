import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FeatherCheck } from '@subframe/core';
import { Button } from './Button';
import { Badge } from './Badge';
import PhotoLightbox from './PhotoLightbox';
import { formatDate } from '../../helper/patientTracking';
import {
  alignersOnDate,
  fetchPhotoBundle,
  groupByDate,
  markAllReviewed,
  markPhotoReviewed,
} from '../../helper/casePhotos';

const p = 'patientTracking.photos';

// Doctor/admin view of the patient's photo timeline. Shown on the case page under
// PatientManagementCard:  <CasePhotosCard caseData={caseData} />
export default function CasePhotosCard({ caseData }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [openIndex, setOpenIndex] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setData(await fetchPhotoBundle(caseData.id));
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    }
  };

  useEffect(() => {
    load();
  }, [caseData.id]);

  const groups = useMemo(() => (data ? groupByDate(data.photos, true) : []), [data]);
  const flat = useMemo(() => groups.flatMap((g) => g.photos), [groups]);
  const indexById = useMemo(() => new Map(flat.map((ph, i) => [ph.id, i])), [flat]);
  const unreviewed = data ? data.photos.filter((ph) => !ph.reviewed_by_doctor).length : 0;

  const alignerLabel = (date) => {
    const { upper, lower } = alignersOnDate(data.starts, date);
    const parts = [];
    if (upper != null) parts.push(t(`${p}.upperAligner`, { n: upper }));
    if (lower != null) parts.push(t(`${p}.lowerAligner`, { n: lower }));
    return parts.length ? parts.join(' · ') : t(`${p}.beforeStart`);
  };
  const longDate = (date) =>
    formatDate(date, lang, { day: 'numeric', month: 'long', year: 'numeric' });

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      await load();
    } catch (e) {
      toast.error(e.message || t('casePhotos.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {t('casePhotos.title')}
          </span>
          {unreviewed > 0 && (
            <Badge variant="warning">{t('casePhotos.newCount', { n: unreviewed })}</Badge>
          )}
        </div>
        {unreviewed > 0 && (
          <Button
            variant="neutral-secondary"
            size="small"
            icon={<FeatherCheck />}
            disabled={busy}
            onClick={() => run(() => markAllReviewed(caseData.id))}
          >
            {t('casePhotos.markAll')}
          </Button>
        )}
      </div>

      <div className="flex h-px w-full flex-none bg-neutral-border" />

      {error ? (
        <span className="text-body font-body text-red-600">{error}</span>
      ) : !data ? (
        <span className="text-body font-body text-subtext-color">{t('common.loading')}</span>
      ) : data.photos.length === 0 ? (
        <span className="text-body font-body text-subtext-color">{t('casePhotos.empty')}</span>
      ) : (
        groups.map((g) => (
          <section key={g.date} className="flex w-full flex-col gap-2">
            <div className="flex w-full items-baseline justify-between gap-2">
              <span className="text-body-bold font-body-bold text-default-font">
                {longDate(g.date)}
              </span>
              <span className="text-caption font-caption text-subtext-color">
                {alignerLabel(g.date)}
              </span>
            </div>
            <div className="grid w-full grid-cols-4 gap-2 md:grid-cols-6">
              {g.photos.map((photo) => {
                const src = data.thumbUrls[photo.thumb_path || photo.storage_path];
                return (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setOpenIndex(indexById.get(photo.id))}
                    className="relative aspect-square overflow-hidden rounded-md bg-neutral-100"
                  >
                    {src && (
                      <img
                        src={src}
                        alt={t(`${p}.views.${photo.view}`)}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    )}
                    <span className="absolute bottom-1 start-1 rounded-full bg-black/55 px-2 py-0.5 text-caption text-white">
                      {t(`${p}.views.${photo.view}`)}
                    </span>
                    {!photo.reviewed_by_doctor && (
                      <span
                        className="absolute end-1 top-1 h-3 w-3 rounded-full bg-[#c9cc4a]"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}

      {data && openIndex !== null && flat[openIndex] && (
        <PhotoLightbox
          photos={flat}
          index={openIndex}
          onClose={() => setOpenIndex(null)}
          onIndexChange={setOpenIndex}
          info={(photo) => (
            <div className="flex flex-col gap-1">
              <span className="text-body-bold">
                {t(`${p}.views.${photo.view}`)} · {longDate(photo.taken_on)}
              </span>
              <span className="text-caption text-white/70">{alignerLabel(photo.taken_on)}</span>
              {photo.note && <p className="whitespace-pre-wrap text-body">{photo.note}</p>}
            </div>
          )}
          actions={(photo) =>
            photo.reviewed_by_doctor ? (
              <span className="flex items-center gap-2 text-caption text-white/80">
                <FeatherCheck className="h-4 w-4" />
                {t('casePhotos.reviewed')}
              </span>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => markPhotoReviewed(photo.id))}
                className="self-start rounded-full bg-white/10 px-4 py-2 text-caption text-white disabled:opacity-50"
              >
                {t('casePhotos.markOne')}
              </button>
            )
          }
        />
      )}
    </div>
  );
}