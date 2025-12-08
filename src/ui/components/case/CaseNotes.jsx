import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import Error from '../Error';
import { FeatherEdit3, FeatherSave, FeatherFileText } from '@subframe/core';

const CaseNotes = ({
  noteText,
  setNoteText,
  isEditingNote,
  noteSaving,
  noteError,
  handleEditNote,
  handleCancelEditNote,
  handleSaveNote,
  caseData,
  isAdmin = false,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-center gap-2">
        <FeatherFileText className="h-5 w-5 text-neutral-600" />
        <span className="text-heading-3 font-heading-3 text-default-font">
          {isAdmin
            ? t('casePage.caseNotes.doctorNotes')
            : t('casePage.caseNotes.caseNotes')}
        </span>
      </div>

      {noteError && (
        <div className="w-full">
          <Error error={noteError} />
        </div>
      )}

      <div className="w-full">
        {isEditingNote ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="noteTextarea"
                className="text-body-bold font-body-bold text-default-font"
              >
                {t('casePage.caseNotes.additionalNotes')}
              </label>
              <textarea
                id="noteTextarea"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={
                  isAdmin
                    ? t('casePage.caseNotes.adminPlaceholder')
                    : t('casePage.caseNotes.userPlaceholder')
                }
                rows={6}
                className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[120px] placeholder:text-subtext-color"
                disabled={noteSaving}
              />
              <span className="text-caption font-caption text-subtext-color">
                {isAdmin
                  ? t('casePage.caseNotes.adminHelp')
                  : t('casePage.caseNotes.userHelp')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                icon={<FeatherSave />}
                onClick={handleSaveNote}
                disabled={noteSaving}
                size="small"
              >
                {noteSaving
                  ? t('casePage.caseNotes.saving')
                  : t('casePage.caseNotes.saveNote')}
              </Button>
              <Button
                variant="neutral-secondary"
                onClick={handleCancelEditNote}
                disabled={noteSaving}
                size="small"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {caseData.user_note ? (
              <div className="w-full bg-white border border-neutral-200 rounded-md p-4 shadow-sm hover:border-neutral-300 transition-colors">
                <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                  {caseData.user_note}
                </div>
              </div>
            ) : (
              <div className="w-full bg-neutral-50 text-sm text-neutral-500 rounded-md p-3">
                {t('casePage.caseNotes.noNotes')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CaseNotes;
