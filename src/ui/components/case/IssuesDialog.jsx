import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Dialog } from '../Dialog';
import { Badge } from '../Badge';
import IssueThread from './IssueThread';
import {
  fetchIssues,
  formatDateTime,
  needsDoctorReply,
  sendIssueMessage,
  setIssueStatus,
} from '../../../helper/patientIssues';

const p = 'issues';
const BADGE = { open: 'warning', answered: 'success', resolved: 'neutral' };

// Doctor/admin view: every issue the patient reported, with dates, and the reply box.
// Opened from PatientManagementCard.   onChanged refreshes the badge there.
export default function IssuesDialog({ isOpen, onClose, caseData, onChanged }) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const load = useCallback(async () => {
    try {
      setData(await fetchIssues(caseData.id));
      setError(null);
    } catch (e) {
      setError(e.message || String(e));
    }
  }, [caseData.id]);

  useEffect(() => {
    if (!isOpen) return;
    setData(null);
    setExpandedId(null);
    load();
  }, [isOpen, load]);

  // After any change: reload the thread and tell the card to refresh its count.
  const changed = async () => {
    await load();
    onChanged?.();
  };

  const run = async (fn) => {
    try {
      await fn();
      await changed();
    } catch (e) {
      toast.error(e.message || t(`${p}.sendFailed`));
    }
  };

  const aligners = (i) =>
    [
      i.upper_aligner != null && t(`${p}.upperAligner`, { n: i.upper_aligner }),
      i.lower_aligner != null && t(`${p}.lowerAligner`, { n: i.lower_aligner }),
    ]
      .filter(Boolean)
      .join(' · ');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content className="w-full max-w-lg p-6">
        <div className="flex w-full max-h-[80vh] flex-col gap-4 overflow-y-auto">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {t(`${p}.doctorTitle`)}
          </span>

          {error ? (
            <span className="text-body font-body text-red-600">{error}</span>
          ) : !data ? (
            <span className="text-body font-body text-subtext-color">{t('common.loading')}</span>
          ) : data.issues.length === 0 ? (
            <span className="text-body font-body text-subtext-color">{t(`${p}.doctorEmpty`)}</span>
          ) : (
            data.issues.map((issue) => {
              const expanded = expandedId === issue.id;
              return (
                <div
                  key={issue.id}
                  className="flex w-full flex-col gap-3 rounded-md border border-solid border-neutral-border px-4 py-3"
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : issue.id)}
                    className="flex w-full flex-col gap-1 text-start"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="text-body-bold font-body-bold text-default-font">
                        {t(`${p}.categories.${issue.category}`)}
                        {issue.arch ? ` · ${t(`${p}.arches.${issue.arch}`)}` : ''}
                      </span>
                      <Badge variant={BADGE[issue.status]}>
                        {needsDoctorReply(issue)
                          ? t(`${p}.status.needsReply`)
                          : t(`${p}.status.${issue.status}`)}
                      </Badge>
                    </div>
                    <span className="text-caption font-caption text-subtext-color">
                      {formatDateTime(issue.created_at, lang)}
                      {aligners(issue) ? ` · ${aligners(issue)}` : ''}
                    </span>
                    {!expanded && issue.messages[0] && (
                      <span className="line-clamp-2 text-body font-body text-default-font">
                        {issue.messages[0].body}
                      </span>
                    )}
                  </button>

                  {expanded && (
                    <IssueThread
                      issue={issue}
                      thumbUrls={data.thumbUrls}
                      viewerRole="doctor"
                      formatDateTime={(ts) => formatDateTime(ts, lang)}
                      onSend={async ({ body }) => {
                        await sendIssueMessage({
                          caseId: caseData.id,
                          userId: null,
                          issueId: issue.id,
                          body,
                        });
                        await changed();
                      }}
                      onResolve={() => run(() => setIssueStatus(issue.id, 'resolved'))}
                      onReopen={() => run(() => setIssueStatus(issue.id, 'open'))}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
      </Dialog.Content>
    </Dialog>
  );
}