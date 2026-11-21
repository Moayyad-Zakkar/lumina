import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import PhotoLightbox from '../PhotoLightbox';
import IssueComposer from './IssueComposer';

const p = 'issues';

// One issue's conversation: bubbles, attached photos, reply box, resolve / reopen.
//   viewerRole  'patient' | 'doctor'  decides which side is "mine", who may attach photos,
//               and which status buttons appear
//   onSend({ body, files })   onResolve()   onReopen()   all async
export default function IssueThread({
  issue,
  thumbUrls,
  viewerRole,
  formatDateTime,
  onSend,
  onResolve,
  onReopen,
}) {
  const { t } = useTranslation();
  const [openPhoto, setOpenPhoto] = useState(null); // index into `allPhotos`
  const [busy, setBusy] = useState(false);

  const allPhotos = useMemo(() => issue.messages.flatMap((m) => m.photos), [issue.messages]);
  const resolved = issue.status === 'resolved';

  const runStatus = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex w-full flex-col gap-2">
        {issue.messages.map((m) => {
          const mine = m.author_role === viewerRole;
          return (
            <div
              key={m.id}
              className={`flex w-full flex-col gap-1 ${mine ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-body ${
                  mine ? 'bg-brand-600 text-white' : 'bg-neutral-100 text-default-font'
                }`}
              >
                {m.body}
              </div>

              {m.photos.length > 0 && (
                <div className="flex max-w-[85%] flex-wrap gap-1">
                  {m.photos.map((ph) => {
                    const src = thumbUrls[ph.thumb_path || ph.storage_path];
                    return (
                      <button
                        key={ph.id}
                        type="button"
                        onClick={() => setOpenPhoto(allPhotos.findIndex((x) => x.id === ph.id))}
                        className="h-16 w-16 overflow-hidden rounded-xl bg-neutral-100"
                      >
                        {src && <img src={src} alt="" className="h-full w-full object-cover" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <span className="text-caption text-subtext-color">
                {m.author_role === 'doctor' && viewerRole === 'patient'
                  ? `${t(`${p}.doctor`)} · `
                  : ''}
                {formatDateTime(m.created_at)}
              </span>
            </div>
          );
        })}
      </div>

      {resolved && (
        <span className="text-caption text-subtext-color">
          {t(`${p}.resolvedHint`)}
        </span>
      )}

      <IssueComposer
        key={`${issue.id}-${issue.messages.length}`}
        allowPhotos={viewerRole === 'patient'}
        rows={2}
        placeholder={
          resolved && viewerRole === 'patient' ? t(`${p}.reopenPlaceholder`) : t(`${p}.replyPlaceholder`)
        }
        submitLabel={t(`${p}.send`)}
        disabled={busy}
        onSubmit={onSend}
      />

      <div className="flex w-full justify-end">
        {!resolved ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => runStatus(onResolve)}
            className="rounded-full bg-neutral-100 px-4 py-2 text-caption disabled:opacity-50"
          >
            {viewerRole === 'patient' ? t(`${p}.markSolved`) : t(`${p}.resolve`)}
          </button>
        ) : (
          viewerRole === 'doctor' && (
            <button
              type="button"
              disabled={busy}
              onClick={() => runStatus(onReopen)}
              className="rounded-full bg-neutral-100 px-4 py-2 text-caption disabled:opacity-50"
            >
              {t(`${p}.reopen`)}
            </button>
          )
        )}
      </div>

      {openPhoto !== null && allPhotos[openPhoto] && (
        <PhotoLightbox
          photos={allPhotos}
          index={openPhoto}
          onClose={() => setOpenPhoto(null)}
          onIndexChange={setOpenPhoto}
          info={() => null}
          actions={() => null}
        />
      )}
    </div>
  );
}