// src/ui/Pages/patient/ViewerPage.jsx
// Route:
//   { path: '/patient/viewer', loader: patientViewerLoader, element: <ViewerPage /> }
import React, { useEffect, useState } from 'react';
import { useLoaderData } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import {
  FeatherPlay,
  FeatherPause,
  FeatherSkipBack,
  FeatherSkipForward,
  FeatherChevronsLeft,
  FeatherChevronsRight,
  FeatherDownload,
} from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import { VIEWER_VIEWS } from '../../../helper/patientViewer';
import Error from '../../components/Error';
import PatientShell from '../../components/PatientShell';
import ViewButton from '../../components/viewer/ViewButton';
import JawView from '../../components/viewer/JawView';
import { PATIENT_PATHS } from '../patientPaths';

import AlignerFrontIcon from '../../../assets/imgs/views/aligner-front.svg';
import AlignerFrontActiveIcon from '../../../assets/imgs/views/aligner-front-active.svg';
import AlignerLeftIcon from '../../../assets/imgs/views/aligner-left.svg';
import AlignerLeftActiveIcon from '../../../assets/imgs/views/aligner-left-active.svg';
import AlignerRightIcon from '../../../assets/imgs/views/aligner-right.svg';
import AlignerRightActiveIcon from '../../../assets/imgs/views/aligner-right-active.svg';
import AlignerUpperIcon from '../../../assets/imgs/views/aligner-upper.svg';
import AlignerUpperActiveIcon from '../../../assets/imgs/views/aligner-upper-active.svg';
import AlignerLowerIcon from '../../../assets/imgs/views/aligner-lower.svg';
import AlignerLowerActiveIcon from '../../../assets/imgs/views/aligner-lower-active.svg';
import maxilla from '../../../assets/imgs/views/aligner-info-upper.svg';
import mandible from '../../../assets/imgs/views/aligner-info-lower.svg';

const p = 'patientTracking.viewer';

// [active icon, idle icon]
const ICONS = {
  front: [AlignerFrontActiveIcon, AlignerFrontIcon],
  left: [AlignerLeftActiveIcon, AlignerLeftIcon],
  right: [AlignerRightActiveIcon, AlignerRightIcon],
  upper: [AlignerUpperActiveIcon, AlignerUpperIcon],
  lower: [AlignerLowerActiveIcon, AlignerLowerIcon],
};

const EMPTY = [];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const roundBtn =
  'flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm active:scale-95 disabled:opacity-40';
const tabBase = 'flex-1 rounded-full px-4 py-2 text-body-bold font-semibold transition-colors';

export default function ViewerPage() {
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

  return <ViewerView data={data} />;
}

function ViewerView({ data }) {
  const { t, i18n } = useTranslation();
  const { sequenceImages, sequenceVideos, beforeAfter, upperCount, lowerCount } = data;
  const isRTL = i18n.language === 'ar';

  const seqViews = VIEWER_VIEWS.filter(
    (v) => sequenceVideos[v] || sequenceImages[v]?.length > 0,
  );
  const baViews = VIEWER_VIEWS.filter((v) => beforeAfter[v]);

  const [tab, setTab] = useState(
    seqViews.length > 0 || baViews.length === 0 ? 'sequence' : 'beforeAfter',
  );
  const [view, setView] = useState('front');
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [progress, setProgress] = useState(0);

  // The selected view falls back to the first available one when a tab lacks it.
  const available = tab === 'sequence' ? seqViews : baViews;
  const viewKey = available.includes(view) ? view : available[0];

  const images = (tab === 'sequence' && viewKey && sequenceImages[viewKey]) || EMPTY;
  const video = tab === 'sequence' && viewKey ? sequenceVideos[viewKey] : null;
  const baSrc = tab === 'beforeAfter' && viewKey ? beforeAfter[viewKey] : null;
  const showSlides = !video && images.length > 0;

  // Back to the first step when the view or tab changes.
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [viewKey, tab]);

  // Preload every step of the selected view so playback does not stutter.
  useEffect(() => {
    if (images.length === 0) {
      setLoaded(true);
      setProgress(100);
      return undefined;
    }
    let cancelled = false;
    let done = 0;
    setLoaded(false);
    setProgress(0);
    images.forEach((img) => {
      const el = new Image();
      const finish = () => {
        if (cancelled) return;
        done += 1;
        setProgress(Math.round((done / images.length) * 100));
        if (done === images.length) setLoaded(true);
      };
      el.onload = finish;
      el.onerror = finish;
      el.src = img.url;
    });
    return () => {
      cancelled = true;
    };
  }, [images]);

  // Slideshow: one step every 500 ms.
  useEffect(() => {
    if (!playing || images.length === 0) return undefined;
    const id = setInterval(() => setIndex((i) => Math.min(i + 1, images.length - 1)), 500);
    return () => clearInterval(id);
  }, [playing, images]);

  // Stop at the last step.
  useEffect(() => {
    if (playing && images.length > 0 && index >= images.length - 1) setPlaying(false);
  }, [index, playing, images.length]);

  const last = Math.max(0, images.length - 1);
  const togglePlay = () => {
    if (!loaded || !showSlides) return;
    if (!playing && index >= last) setIndex(0);
    setPlaying((v) => !v);
  };
  const seek = (i) => {
    setPlaying(false);
    setIndex(Math.min(Math.max(i, 0), last));
  };

  const openGuide = async () => {
    const { data: pub } = supabase.storage.from('public-docs').getPublicUrl('info-ar.pdf');
    if (Capacitor.isNativePlatform()) await Browser.open({ url: pub.publicUrl });
    else window.open(pub.publicUrl, '_blank', 'noopener');
  };

  const hasMedia = seqViews.length > 0 || baViews.length > 0;
  const points = t('viewer.disclaimer.points', { returnObjects: true });

  return (
    <PatientShell backTo={PATIENT_PATHS.home} title={t(`${p}.pageTitle`)}>
      {!hasMedia ? (
        <p className="text-center text-body text-subtext-color">{t(`${p}.empty`)}</p>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex w-full gap-1 rounded-full bg-white p-1 shadow-sm">
            <button
              type="button"
              disabled={seqViews.length === 0}
              onClick={() => setTab('sequence')}
              className={`${tabBase} ${
                tab === 'sequence' ? 'bg-brand-600 text-white' : 'text-subtext-color'
              } disabled:opacity-40`}
            >
              {t('viewer.sequenceAnimation')}
            </button>
            <button
              type="button"
              disabled={baViews.length === 0}
              onClick={() => setTab('beforeAfter')}
              className={`${tabBase} ${
                tab === 'beforeAfter' ? 'bg-brand-600 text-white' : 'text-subtext-color'
              } disabled:opacity-40`}
            >
              {t('viewer.beforeAfter')}
            </button>
          </div>

          {/* View selector */}
          <div className="flex w-full flex-wrap justify-center gap-2">
            {available.map((v) => (
              <ViewButton
                key={v}
                isActive={viewKey === v}
                activeIcon={ICONS[v][0]}
                disabledIcon={ICONS[v][1]}
                name={cap(v)}
                viewChanger={() => setView(v)}
              />
            ))}
          </div>

          {/* Media */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[28px] bg-black shadow-sm">
            {video && (
              <video
                key={viewKey}
                controls
                loop
                playsInline
                preload="metadata"
                className="h-full w-full object-contain"
              >
                <source src={video} type="video/mp4" />
              </video>
            )}

            {showSlides && (
              <>
                {images.map((img, i) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt={`${viewKey} - ${i + 1}`}
                    className="absolute inset-0 h-full w-full object-contain transition-opacity"
                    style={{
                      display: i === index ? 'block' : 'none',
                      opacity: loaded ? 1 : 0.3,
                    }}
                  />
                ))}

                {!loaded && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <span className="text-body-bold text-white">
                      {t('viewer.preloadingImages')} {progress}%
                    </span>
                    <div className="h-1.5 w-48 overflow-hidden rounded-full bg-white/30">
                      <div className="h-full bg-brand-600" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="h-1 w-full overflow-hidden rounded-full bg-white/30" dir="ltr">
                    <div
                      className="h-full bg-brand-600 transition-[width] duration-300"
                      style={{ width: `${((index + 1) / images.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-center text-caption font-semibold text-white">
                    {t('viewer.step')} {index + 1} {t('viewer.of')} {images.length}
                  </span>
                </div>
              </>
            )}

            {baSrc && (
              <img src={baSrc} alt={viewKey} className="h-full w-full object-contain" />
            )}

            {!video && !showSlides && !baSrc && (
              <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-body text-white">
                {tab === 'sequence'
                  ? t('viewer.noSequenceImages')
                  : t('viewer.noBeforeAfterImage')}
              </p>
            )}
          </div>

          {/* Player controls (image sequences only) */}
          {showSlides && (
            <div className="flex w-full items-center justify-center gap-3" dir="ltr">
              <button type="button" className={roundBtn} disabled={!loaded} onClick={() => seek(0)} aria-label={t('viewer.jumpToStart')}>
                <FeatherChevronsLeft />
              </button>
              <button type="button" className={roundBtn} disabled={!loaded} onClick={() => seek(index - 1)} aria-label={t('viewer.previousStep')}>
                <FeatherSkipBack />
              </button>
              <button
                type="button"
                disabled={!loaded}
                onClick={togglePlay}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-white shadow-sm active:scale-95 disabled:opacity-40"
              >
                {playing ? <FeatherPause /> : <FeatherPlay />}
              </button>
              <button type="button" className={roundBtn} disabled={!loaded} onClick={() => seek(index + 1)} aria-label={t('viewer.nextStep')}>
                <FeatherSkipForward />
              </button>
              <button type="button" className={roundBtn} disabled={!loaded} onClick={() => seek(last)} aria-label={t('viewer.jumpToEnd')}>
                <FeatherChevronsRight />
              </button>
            </div>
          )}

          {/* Aligner counts */}
          {(upperCount > 0 || lowerCount > 0) && (
            <div className="flex w-full flex-wrap justify-center gap-3">
              {upperCount > 0 && (
                <div className="rounded-[28px] bg-white px-8 py-4 shadow-sm">
                  <JawView upperCount={upperCount} jawImg={maxilla} name={t('viewer.upperAligners')} />
                </div>
              )}
              {lowerCount > 0 && (
                <div className="rounded-[28px] bg-white px-8 py-4 shadow-sm">
                  <JawView upperCount={lowerCount} jawImg={mandible} name={t('viewer.lowerAligners')} />
                </div>
              )}
            </div>
          )}

          {/* User guide (Arabic PDF only) */}
          {isRTL && (
            <button
              type="button"
              onClick={openGuide}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-body-bold font-semibold text-brand-600 shadow-sm"
            >
              <FeatherDownload className="h-5 w-5" />
              {t(`${p}.downloadGuide`)}
            </button>
          )}

          {/* Disclaimer */}
          {Array.isArray(points) && points.length > 0 && (
            <div className="w-full rounded-[28px] border border-solid border-amber-300 bg-amber-50 p-5">
              <p className="mb-2 text-center text-body-bold text-amber-900">
                {t('viewer.disclaimer.title')}
              </p>
              <ul className="list-disc ps-5 text-caption leading-relaxed text-amber-900">
                {points.map((pt, i) => (
                  <li key={i}>{pt}.</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </PatientShell>
  );
}