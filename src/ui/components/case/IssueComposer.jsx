import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherCamera, FeatherX } from '@subframe/core';
import { MAX_ISSUE_BODY, MAX_ISSUE_PHOTOS } from '../../../helper/patientIssues';

const p = 'issues';

let nextId = 1;

// Text box + optional photo picker, shared by the patient's "new issue" form, the follow-up box
// in a thread, and the doctor's reply box.
//   onSubmit({ body, files })  async; throw to show the error and keep what was typed
//   disabled                   parent-level lock (e.g. while resolving)
export default function IssueComposer({
  allowPhotos = false,
  placeholder,
  submitLabel,
  disabled = false,
  onSubmit,
  rows = 3,
}) {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [body, setBody] = useState('');
  const [items, setItems] = useState([]); // { id, file, previewUrl }
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState(null);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  });
  useEffect(
    () => () => itemsRef.current.forEach((i) => URL.revokeObjectURL(i.previewUrl)),
    [],
  );

  const onPick = (e) => {
    const picked = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/'));
    e.target.value = '';
    setErr(null);
    const room = Math.max(0, MAX_ISSUE_PHOTOS - items.length);
    if (picked.length > room) setErr(t(`${p}.tooManyPhotos`, { max: MAX_ISSUE_PHOTOS }));
    const added = picked
      .slice(0, room)
      .map((file) => ({ id: nextId++, file, previewUrl: URL.createObjectURL(file) }));
    setItems([...items, ...added]);
  };

  const removeItem = (item) => {
    URL.revokeObjectURL(item.previewUrl);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const canSend = body.trim().length > 0 && !sending && !disabled;

  const submit = async () => {
    setErr(null);
    setSending(true);
    try {
      await onSubmit({ body: body.trim(), files: items.map((i) => i.file) });
      items.forEach((i) => URL.revokeObjectURL(i.previewUrl));
      setItems([]);
      setBody('');
    } catch (e) {
      setErr(e.message || t(`${p}.sendFailed`));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-2">
      <textarea
        value={body}
        rows={rows}
        maxLength={MAX_ISSUE_BODY}
        disabled={sending || disabled}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-solid border-neutral-border bg-white px-4 py-3 text-body"
      />

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <div key={item.id} className="relative h-16 w-16">
              <img
                src={item.previewUrl}
                alt=""
                className="h-16 w-16 rounded-xl bg-neutral-100 object-cover"
              />
              <button
                type="button"
                disabled={sending}
                onClick={() => removeItem(item)}
                aria-label={t(`${p}.removePhoto`)}
                className="absolute -end-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-700 text-white"
              >
                <FeatherX className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {err && <span className="text-caption text-red-600">{err}</span>}

      <div className="flex items-center justify-between gap-2">
        {allowPhotos ? (
          <>
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
              disabled={sending || disabled || items.length >= MAX_ISSUE_PHOTOS}
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-caption disabled:opacity-50"
            >
              <FeatherCamera className="h-4 w-4" />
              {t(`${p}.addPhoto`)}
            </button>
          </>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={!canSend}
          onClick={submit}
          className="rounded-full bg-brand-600 px-6 py-2 text-body-bold font-bold text-white disabled:opacity-50"
        >
          {sending ? t(`${p}.sending`) : submitLabel}
        </button>
      </div>
    </div>
  );
}