import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import Error from '../Error';
import { FeatherEdit3, FeatherSave } from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

const InternalNotesSection = ({ caseData }) => {
  const { t } = useTranslation();
  const [internalNote, setInternalNote] = useState(caseData?.admin_note || '');
  const [isEditingInternalNote, setIsEditingInternalNote] = useState(false);
  const [internalNoteBackup, setInternalNoteBackup] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const handleEditInternalNote = () => {
    setInternalNoteBackup(internalNote);
    setIsEditingInternalNote(true);
  };

  const handleCancelEditInternalNote = () => {
    setInternalNote(internalNoteBackup);
    setIsEditingInternalNote(false);
    setNoteError(null);
  };

  const handleSaveInternalNote = async () => {
    try {
      setSavingNote(true);
      setNoteError(null);
      const { error } = await supabase
        .from('cases')
        .update({ internal_note: internalNote })
        .eq('id', caseData.id);
      if (error) throw error;
      toast.success(t('internalNotes.toast.saved'));
      setIsEditingInternalNote(false);
    } catch (err) {
      setNoteError(err.message || t('internalNotes.toast.saveFailed'));
      toast.error(err.message || t('internalNotes.toast.saveFailed'));
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <span className="text-heading-3 font-heading-3 text-default-font">
          {t('internalNotes.title')}
        </span>
        {!isEditingInternalNote && (
          <Button
            variant="neutral-secondary"
            size="small"
            icon={<FeatherEdit3 />}
            onClick={handleEditInternalNote}
          >
            {internalNote
              ? t('internalNotes.editNote')
              : t('internalNotes.addNote')}
          </Button>
        )}
      </div>

      {noteError && (
        <div className="w-full">
          <Error error={noteError} />
        </div>
      )}

      <div className="w-full">
        {isEditingInternalNote ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="internalNoteTextarea"
                className="text-body-bold font-body-bold text-default-font"
              >
                {t('internalNotes.additionalNotes')}
              </label>
              <textarea
                id="internalNoteTextarea"
                value={internalNote}
                onChange={(e) => setInternalNote(e.target.value)}
                placeholder={t('internalNotes.placeholder')}
                rows={6}
                className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[120px] placeholder:text-subtext-color"
                disabled={savingNote}
              />
              <span className="text-caption font-caption text-subtext-color">
                {t('internalNotes.helpText')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                icon={<FeatherSave />}
                onClick={handleSaveInternalNote}
                disabled={savingNote}
                size="small"
              >
                {savingNote
                  ? t('internalNotes.saving')
                  : t('internalNotes.saveNote')}
              </Button>
              <Button
                variant="neutral-secondary"
                onClick={handleCancelEditInternalNote}
                disabled={savingNote}
                size="small"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {internalNote ? (
              <div className="w-full bg-white border border-neutral-200 rounded-md p-4 shadow-sm">
                <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                  {internalNote}
                </div>
              </div>
            ) : (
              <div className="w-full bg-neutral-50 text-sm text-neutral-500 rounded-md p-3">
                {t('internalNotes.noNotes')}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InternalNotesSection;
