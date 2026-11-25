// src/ui/components/BroadcastPanel.jsx
// Content of the "Announcements" tab on the admin settings page (super admins only).
// Compose (Arabic + English) -> review with recipient numbers -> send. History below.
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import supabase from '../../helper/supabaseClient';
import { Button } from './Button';

const cardCls =
  'flex w-full flex-col gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm';
const inputCls =
  'w-full rounded-md border border-solid border-neutral-border bg-white px-3 py-2 text-body';

export default function BroadcastPanel() {
  const { t, i18n } = useTranslation();

  const [audience, setAudience] = useState('all_patients');
  const [titleEn, setTitleEn] = useState('');
  const [bodyEn, setBodyEn] = useState('');
  const [titleAr, setTitleAr] = useState('');
  const [bodyAr, setBodyAr] = useState('');
  const [step, setStep] = useState('compose'); // 'compose' | 'confirm'
  const [counts, setCounts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const audienceLabel = (a) => t(a === 'all_patients' ? 'broadcast.patients' : 'broadcast.doctors');
  const valid = [titleEn, bodyEn, titleAr, bodyAr].every((v) => v.trim());

  const loadHistory = useCallback(async () => {
    const { data, error: err } = await supabase.rpc('list_broadcasts', { p_limit: 20 });
    if (!err) setHistory(data || []);
    setHistoryLoading(false);
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
    loadHistory();
  };

  return (
    <>
      <div className="flex w-full flex-col items-start gap-6">
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('broadcast.title')}
        </span>

        <div className={cardCls}>
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
                      {audienceLabel(a)}
                    </button>
                  ))}
                </div>
                <span className="text-caption text-subtext-color">
                  {t('broadcast.languageHint')}
                </span>
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

              <div className="flex justify-end">
                <Button className="w-auto" onClick={review} disabled={!valid || busy} loading={busy}>
                  {t('broadcast.review')}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-md bg-amber-50 p-4 text-body text-amber-900">
                {t('broadcast.confirmLine', {
                  count: counts?.recipients ?? 0,
                  audience: audienceLabel(audience),
                  withApp: counts?.with_app ?? 0,
                })}
                <div className="mt-1 text-caption">{t('broadcast.confirmWarning')}</div>
              </div>

              <div className="flex flex-col gap-1 rounded-md bg-neutral-50 p-3" dir="ltr">
                <span className="text-body-bold">{titleEn}</span>
                <span className="whitespace-pre-wrap text-caption text-subtext-color">
                  {bodyEn}
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-md bg-neutral-50 p-3" dir="rtl">
                <span className="text-body-bold">{titleAr}</span>
                <span className="whitespace-pre-wrap text-caption text-subtext-color">
                  {bodyAr}
                </span>
              </div>

              {error && <span className="text-caption text-red-600">{error}</span>}

              <div className="flex justify-end gap-2">
                <Button
                  className="w-auto"
                  variant="neutral-secondary"
                  onClick={() => setStep('compose')}
                  disabled={busy}
                >
                  {t('broadcast.back')}
                </Button>
                <Button className="w-auto" onClick={send} disabled={busy} loading={busy}>
                  {t('broadcast.send')}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex w-full flex-col items-start gap-6">
        <span className="text-heading-2 font-heading-2 text-default-font">
          {t('broadcast.history')}
        </span>
        <div className={cardCls}>
          {historyLoading ? (
            <span className="text-body text-subtext-color">{t('notifications.loading')}</span>
          ) : history.length === 0 ? (
            <span className="text-body text-subtext-color">{t('broadcast.historyEmpty')}</span>
          ) : (
            history.map((b) => (
              <div key={b.id} className="flex flex-col gap-1 rounded-md bg-neutral-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-body-bold">{b.title}</span>
                  <span className="flex-none text-caption text-subtext-color">
                    {new Date(b.created_at).toLocaleString(i18n.language)}
                  </span>
                </div>
                <span className="text-caption text-subtext-color">
                  {audienceLabel(b.audience)} ·{' '}
                  {t('broadcast.recipientsRead', { sent: b.recipients, read: b.read_count })}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}