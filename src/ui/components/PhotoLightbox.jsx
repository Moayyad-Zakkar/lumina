import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherX, FeatherChevronLeft, FeatherChevronRight } from '@subframe/core';
import { signOne } from '../../helper/casePhotos';

// Full-screen viewer shared by the patient timeline and the doctor's gallery.
//   photos        the photos in the order shown (so prev/next follows the timeline)
//   info(photo)   node shown under the image (date, view, note)
//   actions(photo) node with buttons (delete / mark reviewed)
export default function PhotoLightbox({ photos, index, onClose, onIndexChange, info, actions }) {
  const { t } = useTranslation();
  const photo = photos[index];
  const path = photo?.storage_path;
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  // The grid only has thumbnails; sign the full-size file when a photo is opened.
  useEffect(() => {
    if (!path) return undefined;
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    signOne(path)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndexChange(index - 1);
      if (e.key === 'ArrowRight' && index < photos.length - 1) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, photos.length, onClose, onIndexChange]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!photo) return null;

  const stop = (e) => e.stopPropagation();
  const navBtn =
    'absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white disabled:hidden';

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white" onClick={stop}>
        <span className="text-caption">
          {index + 1} / {photos.length}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('patientTracking.photos.close')}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
        >
          <FeatherX className="h-5 w-5" />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {url ? (
          <img
            src={url}
            alt=""
            className="max-h-full max-w-full object-contain"
            onClick={stop}
          />
        ) : (
          <span className="text-body text-white/70">
            {failed ? t('patientTracking.photos.loadFailed') : t('patientTracking.photos.loading')}
          </span>
        )}

        <button
          type="button"
          disabled={index === 0}
          onClick={(e) => {
            stop(e);
            onIndexChange(index - 1);
          }}
          className={`${navBtn} start-2`}
          aria-label="previous"
        >
          <FeatherChevronLeft className="h-6 w-6 rtl:rotate-180" />
        </button>
        <button
          type="button"
          disabled={index >= photos.length - 1}
          onClick={(e) => {
            stop(e);
            onIndexChange(index + 1);
          }}
          className={`${navBtn} end-2`}
          aria-label="next"
        >
          <FeatherChevronRight className="h-6 w-6 rtl:rotate-180" />
        </button>
      </div>

      <div className="flex flex-col gap-3 bg-black/60 px-4 py-4 text-white" onClick={stop}>
        {info && info(photo)}
        {actions && actions(photo)}
      </div>
    </div>
  );
}