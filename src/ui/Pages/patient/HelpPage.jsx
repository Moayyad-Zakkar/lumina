import React, { useState } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import Error from '../../components/Error';
import PatientShell from '../../components/PatientShell';
import IssueComposer from '../../components/case/IssueComposer';
import IssueThread from '../../components/case/IssueThread';
import { PATIENT_PATHS } from '../patientPaths';
import {
  ISSUE_ARCHES,
  ISSUE_CATEGORIES,
  createIssue,
  formatDateTime,
  hasUnreadReply,
  markIssueSeen,
  sendIssueMessage,
  setIssueStatus,
} from '../../../helper/patientIssues';

// Routes:
//   { path: '/patient/help', loader: patientIssuesLoader, element: <HelpPage /> }

const p = 'issues';

const STATUS_STYLE = {
  open: 'bg-amber-100 text-amber-900',
  answered: 'bg-green-100 text-green-900',
  resolved: 'bg-neutral-100 text-subtext-color',
};

const primaryBtn =
  'w-full rounded-full bg-brand-600 px-6 py-4 text-body-bold font-bold text-white shadow-sm transition-transform active:scale-[0.99]';

export default function HelpPage() {
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
  return <HelpView data={data} />;
}

// Module scope on purpose: defined inside HelpView it would remount (and lose typing) on every render.
function NewIssueForm({ caseId, userId, onCreated, onCancel }) {
  const { t } = useTranslation();
  const [category, setCategory] = useState(null);
  const [arch, setArch] = useState('both');

  return (
    <div className="flex w-full flex-col gap-3 rounded-[28px] border border-solid border-neutral-border bg-white p-5 shadow-sm">
      <span className="text-body-bold text-brand-600">{t(`${p}.whatHappened`)}</span>
      <div className="flex flex-wrap gap-2">
        {ISSUE_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={`rounded-full px-4 py-2 text-caption ${
              category === c ? 'bg-brand-600 text-white' : 'bg-neutral-100'
            }`}
          >
            {t(`${p}.categories.${c}`)}
          </button>
        ))}
      </div>

      <span className="text-body-bold text-brand-600">{t(`${p}.whichArch`)}</span>
      <div className="flex gap-2">
        {ISSUE_ARCHES.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => setArch(a)}
            aria-pressed={arch === a}
            className={`rounded-full px-4 py-2 text-caption ${
              arch === a ? 'bg-brand-600 text-white' : 'bg-neutral-100'
            }`}
          >
            {t(`${p}.arches.${a}`)}
          </button>
        ))}
      </div>

      <IssueComposer
        allowPhotos
        placeholder={t(`${p}.describePlaceholder`)}
        submitLabel={t(`${p}.submit`)}
        disabled={!category}
        onSubmit={async ({ body, files }) => {
          await createIssue({ caseId, userId, category, arch, body, files });
          toast.success(t(`${p}.sent`));
          onCreated();
        }}
      />
      {!category && <span className="text-caption text-subtext-color">{t(`${p}.pickCategory`)}</span>}

      <button type="button" onClick={onCancel} className="self-start text-caption underline">
        {t(`${p}.cancel`)}
      </button>
    </div>
  );
}

function IssueCard({ issue, caseId, userId, thumbUrls, expanded, onToggle, onChanged }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const unread = hasUnreadReply(issue);
  const first = issue.messages[0];

  const aligners = [
    issue.upper_aligner != null && t(`${p}.upperAligner`, { n: issue.upper_aligner }),
    issue.lower_aligner != null && t(`${p}.lowerAligner`, { n: issue.lower_aligner }),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex w-full flex-col gap-3 rounded-[28px] border border-solid border-neutral-border bg-white p-5 shadow-sm">
      <button type="button" onClick={onToggle} className="flex w-full flex-col gap-1 text-start">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-body-bold">
            {unread && <span className="h-2.5 w-2.5 rounded-full bg-[#c9cc4a]" aria-hidden />}
            {t(`${p}.categories.${issue.category}`)}
          </span>
          <span className={`rounded-full px-3 py-1 text-caption ${STATUS_STYLE[issue.status]}`}>
            {t(`${p}.status.${issue.status}`)}
          </span>
        </div>
        <span className="text-caption text-subtext-color">
          {formatDateTime(issue.created_at, lang)}
          {aligners ? ` · ${aligners}` : ''}
        </span>
        {!expanded && first && (
          <span className="line-clamp-2 text-body text-default-font">{first.body}</span>
        )}
      </button>

      {expanded && (
        <IssueThread
          issue={issue}
          thumbUrls={thumbUrls}
          viewerRole="patient"
          formatDateTime={(ts) => formatDateTime(ts, lang)}
          onSend={async ({ body, files }) => {
            await sendIssueMessage({ caseId, userId, issueId: issue.id, body, files });
            onChanged();
          }}
          onResolve={async () => {
            try {
              await setIssueStatus(issue.id, 'resolved');
              onChanged();
            } catch (e) {
              toast.error(e.message || String(e));
            }
          }}
          onReopen={async () => {}}
        />
      )}
    </div>
  );
}

function HelpView({ data }) {
  const { t } = useTranslation();
  const revalidator = useRevalidator();
  const { caseId, userId, issues, thumbUrls } = data;
  const [creating, setCreating] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const toggle = async (issue) => {
    const opening = expandedId !== issue.id;
    setExpandedId(opening ? issue.id : null);
    if (opening && hasUnreadReply(issue)) {
      try {
        await markIssueSeen(issue.id);
        revalidator.revalidate();
      } catch {
        // the dot just stays; not worth interrupting the patient
      }
    }
  };

  return (
    <PatientShell backTo={PATIENT_PATHS.home} title={t(`${p}.pageTitle`)}>
      <p className="w-full rounded-2xl bg-amber-50 px-4 py-3 text-caption text-amber-900">
        {t(`${p}.emergency`)}
      </p>

      {creating ? (
        <NewIssueForm
          caseId={caseId}
          userId={userId}
          onCancel={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            revalidator.revalidate();
          }}
        />
      ) : (
        <button type="button" className={primaryBtn} onClick={() => setCreating(true)}>
          {t(`${p}.report`)}
        </button>
      )}

      {issues.length === 0 && !creating && (
        <p className="text-center text-body text-subtext-color">{t(`${p}.empty`)}</p>
      )}

      {issues.map((issue) => (
        <IssueCard
          key={issue.id}
          issue={issue}
          caseId={caseId}
          userId={userId}
          thumbUrls={thumbUrls}
          expanded={expandedId === issue.id}
          onToggle={() => toggle(issue)}
          onChanged={() => revalidator.revalidate()}
        />
      ))}
    </PatientShell>
  );
}