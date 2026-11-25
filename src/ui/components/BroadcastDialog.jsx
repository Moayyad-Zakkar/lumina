// src/ui/components/BroadcastDialog.jsx
// Admin: send an announcement to all patients or all doctors, in Arabic and English.
// Step 1 = write it, step 2 = confirm with the recipient numbers, then send.
//   <BroadcastDialog isOpen={open} onClose={() => setOpen(false)} />
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import supabase from '../../helper/supabaseClient';
import { Button } from './Button';

const inputCls =
  'w-full rounded-md border border-solid border-neutral-border bg-white px-3 py-2 text-body';

export default function BroadcastDialog({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [audience, setAudience] = useState('all_patients');
  const [titleEn, setTitleEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [step, setStep] = useState('compose'); // 'compose' | 'confirm'
  const [counts, setCounts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const valid = [titleEn, bodyEn, titleAr, bodyAr].every((v) => v.trim());

  const reset = () => {
    setAudience('all_patients');
    setTitleEn('');
    setBodyEn('');
    setTitleAr('');
    setBodyAr('');
    setStep('compose');
    setCounts(null);
    setError(null);
  };

  const close = () => {
    if (busy) return;
    reset();
    onClose();
  };

  const review = async () => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('broadcast_recipient_count', {
      p_audience: audience,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    setCounts(data);
    setStep('confirm');
  };

  const send = async () => {
    setBusy(true);
    setError(null);
    const { data, error: err } = await supabase.rpc('send_broadcast', {
      p_audience: audience,
      p_title_en: titleEn,
      p_body_en: bodyEn,
      p_title_ar: titleAr,
      p_body_ar: bodyAr,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    toast.success(t('broadcast.sent', { count: data?.recipients ?? 0 }));
    reset();
    onClose();
  };

  const audienceLabel = t(audience === 'all_patients' ? 'broadcast.patients' : 'broadcast.doctors');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={close}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-md bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('broadcast.title')}
        </span>

        {step === 'compose' ? (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-body-bold">{t('broadcast.audience')}</span>
              <div className="flex gap-2">
                {['all_patients', 'all_doctors'].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => setAudience(a)}
                    className={`flex-1 rounded-md border border-solid px-3 py-2 text-body-bold ${
                      audience === a
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-neutral-border bg-white text-subtext-color'
                    }`}
                  >
                    {t(a === 'all_patients' ? 'broadcast.patients' : 'broadcast.doctors')}
                  </button>
                ))}
              </div>
              <span className="text-caption text-subtext-color">{t('broadcast.languageHint')}</span>
            </div>

            <div className="flex flex-col gap-2" dir="ltr">
              <span className="text-body-bold">{t('broadcast.english')}</span>
              <input
                className={inputCls}
                maxLength={80}
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder={t('broadcast.titleLabel')}
              />
              <textarea
                className={`${inputCls} min-h-24`}
                maxLength={500}
                value={bodyEn}
                onChange={(e) => setBodyEn(e.target.value)}
                placeholder={t('broadcast.bodyLabel')}
              />
            </div>

            <div className="flex flex-col gap-2" dir="rtl">
              <span className="text-body-bold">{t('broadcast.arabic')}</span>
              <input
                className={inputCls}
                maxLength={80}
                value={titleAr}
                onChange={(e) => setTitleAr(e.target.value)}
                placeholder={t('broadcast.titleLabel')}
              />
              <textarea
                className={`${inputCls} min-h-24`}
                maxLength={500}
                value={bodyAr}
                onChange={(e) => setBodyAr(e.target.value)}
                placeholder={t('broadcast.bodyLabel')}
              />
            </div>

            {error && <span className="text-caption text-red-600">{error}</span>}

            <div className="flex justify-end gap-2">
              <Button variant="neutral-secondary" onClick={close} disabled={busy}>
                {t('broadcast.cancel')}
              </Button>
              <Button onClick={review} disabled={!valid || busy}>
                {t('broadcast.review')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-md bg-amber-50 p-4 text-body text-amber-900">
              {t('broadcast.confirmLine', {
                count: counts?.recipients ?? 0,
                audience: audienceLabel,
                withApp: counts?.with_app ?? 0,
              })}
              <div className="mt-1 text-caption">{t('broadcast.confirmWarning')}</div>
            </div>

            <div className="flex flex-col gap-1 rounded-md bg-neutral-50 p-3" dir="ltr">
              <span className="text-body-bold">{titleEn}</span>
              <span className="whitespace-pre-wrap text-caption text-subtext-color">{bodyEn}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-md bg-neutral-50 p-3" dir="rtl">
              <span className="text-body-bold">{titleAr}</span>
              <span className="whitespace-pre-wrap text-caption text-subtext-color">{bodyAr}</span>
            </div>

            {error && <span className="text-caption text-red-600">{error}</span>}

            <div className="flex justify-end gap-2">
              <Button variant="neutral-secondary" onClick={() => setStep('compose')} disabled={busy}>
                {t('broadcast.back')}
              </Button>
              <Button onClick={send} disabled={busy}>
                {busy ? t('broadcast.sending') : t('broadcast.send')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}