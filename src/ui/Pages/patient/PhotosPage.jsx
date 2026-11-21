import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { FeatherCamera, FeatherCheck, FeatherX } from '@subframe/core';
import Error from '../../components/Error';
import PatientShell from '../../components/PatientShell';
import PhotoLightbox from '../../components/PhotoLightbox';
import { PATIENT_PATHS } from '../patientPaths';
import { addDays, formatDate } from '../../../helper/patientTracking';
import {
  MAX_FILES_PER_UPLOAD,
  PHOTO_VIEWS,
  alignersOnDate,
  deleteCasePhoto,
  groupByDate,
  uploadCasePhoto,
} from '../../../helper/casePhotos';

// Routes:
//   { path: '/patient/photos', loader: patientPhotosLoader, element: <PhotosPage /> }

const p = 'patientTracking.photos';

const primaryBtn =
  'w-full rounded-full bg-brand-600 px-6 py-4 text-body-bold font-bold text-white shadow-sm transition-transform active:scale-[0.99] disabled:opacity-50';
const ghostBtn =
  'flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-body-bold font-semibold text-brand-600 shadow-sm disabled:opacity-50';

export default function PhotosPage() {
  const data = useLoaderData();
  const { t } = useTranslation();

  if (data.error) return <Error error={data.error} />;

  if (!data.caseId) {
    return (
      <PatientShell
        backTo={PATIENT_PATHS.home}
        title={t(`${p}.pageTitle`)}
        subtitle={t('patientTracking.noActiveCase')}
      />
    );
  }

  return <PhotosView data={data} />;
}

let nextItemId = 1;

// Module scope on purpose (a component defined inside another's render remounts every update).
function PhotoUploadPanel({ caseId, userId, today, onChanged, onClose }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [items, setItems] = useState([]); // { id, file, previewUrl, view }
  const [takenOn, setTakenOn] = useState(today);
  const [note, setNote] = useState('');
  const [progress, setProgress] = useState(null); // { done, total } while uploading
  const [err, setErr] = useState(null);
  const itemsRef = useRef(items);
  const uploading = progress !== null;
  const yesterday = addDays(today, -1);

  useEffect(() => {
    itemsRef.current = items;
  });
  useEffect(
    () => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl)),
    [],
  );

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = ''; // lets the same file be picked again
    setErr(null);

    const images = picked.filter((f) => f.type.startsWith('image/'));
    const room = Math.max(0, MAX_FILES_PER_UPLOAD - items.length);
    const take = images.slice(0, room);
    if (images.length < picked.length) setErr(t(`${p}.notImage`));
    else if (images.length > take.length) setErr(t(`${p}.tooMany`, { max: MAX_FILES_PER_UPLOAD }));

    // Suggest the usual intraoral set in order (front, right, left, upper, lower); editable.
    const used = new Set(items.map((i) => i.view));
    const added = take.map((file) => {
      const view = PHOTO_VIEWS.find((v) => v !== 'other' && !used.has(v)) || 'other';
      used.add(view);
      return { id: nextItemId++, file, previewUrl: URL.createObjectURL(file), view };
    });
    setItems([...items, ...added]);
  };

  const setView = (id, view) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, view } : i)));

  const removeItem = (item) => {
    URL.revokeObjectURL(item.previewUrl);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const onUpload = async () => {
    setErr(null);
    const queue = [...items];
    setProgress({ done: 0, total: queue.length });
    let done = 0;

    // One at a time: keeps memory low on phones and means a failure never loses earlier photos.
    for (const item of queue) {
      try {
        await uploadCasePhoto({
          caseId,
          userId,
          file: item.file,
          view: item.view,
          takenOn,
          note,
        });
      } catch (e) {
        setErr(e.message || t(`${p}.uploadFailed`));
        setProgress(null);
        if (done > 0) onChanged();
        return;
      }
      URL.revokeObjectURL(item.previewUrl);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      done += 1;
      setProgress({ done, total: queue.length });
    }

    toast.success(t(`${p}.uploaded`));
    onChanged();
    onClose();
  };

  return (
    <div className="flex w-full flex-col gap-3 rounded-[28px] border border-solid border-neutral-border bg-white p-5 shadow-sm">
      <p className="text-caption text-subtext-color">
        {t(`${p}.hint`, { max: MAX_FILES_PER_UPLOAD })}
      </p>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />
      <button
        type="button"
        className={ghostBtn}
        disabled={uploading || items.length >= MAX_FILES_PER_UPLOAD}
        onClick={() => fileRef.current?.click()}
      >
        <FeatherCamera className="h-5 w-5" />
        {t(`${p}.chooseFiles`)}
      </button>

      {items.map((item) => (
        <div key={item.id} className="flex items-center gap-3">
          <img
            src={item.previewUrl}
            alt=""
            className="h-16 w-16 flex-none rounded-xl bg-neutral-100 object-cover"
          />
          <select
            value={item.view}
            disabled={uploading}
            onChange={(e) => setView(item.id, e.target.value)}
            className="min-w-0 flex-1 rounded-2xl border border-solid border-neutral-border bg-white px-3 py-2 text-body"
          >
            {PHOTO_VIEWS.map((v) => (
              <option key={v} value={v}>
                {t(`${p}.views.${v}`)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={uploading}
            onClick={() => removeItem(item)}
            aria-label={t(`${p}.remove`)}
            className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-neutral-100"
          >
            <FeatherX className="h-4 w-4 text-subtext-color" />
          </button>
        </div>
      ))}

      {items.length > 0 && (
        <>
          <span className="text-body-bold text-brand-600">{t(`${p}.dateLabel`)}</span>
          <input
            type="date"
            value={takenOn}
            max={today}
            disabled={uploading}
            onChange={(e) => setTakenOn(e.target.value || today)}
            className="w-full rounded-2xl border border-solid border-neutral-border px-4 py-3 text-body"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTakenOn(today)}
              className="rounded-full bg-neutral-100 px-4 py-2 text-caption"
            >
              {t(`${p}.today`)}
            </button>
            <button
              type="button"
              onClick={() => setTakenOn(yesterday)}
              className="rounded-full bg-neutral-100 px-4 py-2 text-caption"
            >
              {t(`${p}.yesterday`)}
            </button>
          </div>

          <textarea
            value={note}
            maxLength={500}
            disabled={uploading}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t(`${p}.notePlaceholder`)}
            aria-label={t(`${p}.noteLabel`)}
            className="min-h-20 w-full rounded-2xl border border-solid border-neutral-border px-4 py-3 text-body"
          />
        </>
      )}

      {err && <span className="text-caption text-red-600">{err}</span>}
      {uploading && (
        <span className="text-caption text-subtext-color">
          {t(`${p}.uploading`, { done: progress.done, total: progress.total })}
        </span>
      )}

      <div className="flex gap-3">
        <button type="button" className={ghostBtn} disabled={uploading} onClick={onClose}>
          {t(`${p}.cancel`)}
        </button>
        <button
          type="button"
          className={primaryBtn}
          disabled={items.length === 0 || uploading}
          onClick={onUpload}
        >
          {t(`${p}.upload`)}
        </button>
      </div>
    </div>
  );
}

function PhotosView({ data }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const revalidator = useRevalidator();
  const { caseId, userId, today, photos, starts, thumbUrls } = data;

  const [adding, setAdding] = useState(false);
  const [newestFirst, setNewestFirst] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);

  const groups = useMemo(() => groupByDate(photos, newestFirst), [photos, newestFirst]);
  const flat = useMemo(() => groups.flatMap((g) => g.photos), [groups]);
  const indexById = useMemo(() => new Map(flat.map((ph, i) => [ph.id, i])), [flat]);

  // "Upper aligner 5 · Lower aligner 4", or "Before starting aligners"
  const alignerLabel = (date) => {
    const { upper, lower } = alignersOnDate(starts, date);
    const parts = [];
    if (upper != null) parts.push(t(`${p}.upperAligner`, { n: upper }));
    if (lower != null) parts.push(t(`${p}.lowerAligner`, { n: lower }));
    return parts.length ? parts.join(' · ') : t(`${p}.beforeStart`);
  };

  const longDate = (date) =>
    formatDate(date, lang, { day: 'numeric', month: 'long', year: 'numeric' });

  const onDelete = async (photo) => {
    if (!window.confirm(t(`${p}.deleteConfirm`))) return;
    try {
      await deleteCasePhoto(photo);
      toast.success(t(`${p}.deleted`));
      setOpenIndex(null);
      revalidator.revalidate();
    } catch (e) {
      toast.error(e.message || String(e));
    }
  };

  return (
    <PatientShell backTo={PATIENT_PATHS.home} title={t(`${p}.pageTitle`)}>
      {adding ? (
        <PhotoUploadPanel
          caseId={caseId}
          userId={userId}
          today={today}
          onChanged={() => revalidator.revalidate()}
          onClose={() => setAdding(false)}
        />
      ) : (
        <button type="button" className={primaryBtn} onClick={() => setAdding(true)}>
          {t(`${p}.add`)}
        </button>
      )}

      {photos.length === 0 && !adding && (
        <p className="text-center text-body text-subtext-color">{t(`${p}.empty`)}</p>
      )}

      {photos.length > 0 && (
        <div className="flex w-full justify-end">
          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            className="text-caption text-subtext-color underline"
          >
            {newestFirst ? t(`${p}.sortNewest`) : t(`${p}.sortOldest`)}
          </button>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.date} className="flex w-full flex-col gap-2">
          <div className="flex w-full items-baseline justify-between gap-2">
            <span className="text-body-bold text-brand-600">{longDate(g.date)}</span>
            <span className="text-caption text-subtext-color">{alignerLabel(g.date)}</span>
          </div>
          <div className="grid w-full grid-cols-3 gap-2">
            {g.photos.map((photo) => {
              const src = thumbUrls[photo.thumb_path || photo.storage_path];
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setOpenIndex(indexById.get(photo.id))}
                  className="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100 shadow-sm"
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
                  {photo.reviewed_by_doctor && (
                    <span className="absolute end-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white">
                      <FeatherCheck className="h-3 w-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}

      {openIndex !== null && flat[openIndex] && (
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
                {t(`${p}.reviewed`)}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onDelete(photo)}
                className="self-start rounded-full bg-white/10 px-4 py-2 text-caption text-white"
              >
                {t(`${p}.delete`)}
              </button>
            )
          }
        />
      )}
    </PatientShell>
  );
}