import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherEdit3, FeatherX } from '@subframe/core';
import { Button } from '../Button';

const RequestEditDialog = ({ isOpen, onClose, onChangeMaterial, saving, caseData }) => {
  const { t } = useTranslation();
  const [userNote, setUserNote] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUserNote(caseData?.user_note || '');
    }
  }, [isOpen, caseData?.user_note]);

  const handleClose = () => {
    if (!saving) onClose();
  };

  const hasChanges = () => {
    const originalNote = caseData?.user_note || '';
    return userNote.trim() !== originalNote.trim();
  };

  const handleSubmit = async () => {
    if (onChangeMaterial) {
      // Pass current material unchanged, materialChanged = false, with the note
      await onChangeMaterial(
        caseData?.aligner_material || '',
        false,
        userNote
      );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Dialog Content */}
      <div className="relative bg-white rounded-lg shadow-xl w-full mx-4 p-6 max-w-[540px] max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <FeatherEdit3 className="w-4 h-4 text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-heading-3 font-heading-3 text-default-font">
                {t('casePage.dialogs.requestEdit.title')}
              </h3>
              <p className="mt-1 text-body font-body text-subtext-color">
                {t('casePage.dialogs.requestEdit.subtitle')}
              </p>
            </div>
            <button
              onClick={handleClose}
              disabled={saving}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <FeatherX className="w-6 h-6" />
            </button>
          </div>

          {/* Notes Section */}
          <div className="border border-neutral-border rounded-md p-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="userNote"
                className="text-body-bold font-body-bold text-default-font"
              >
                {t('casePage.dialogs.requestEdit.notesLabel')}
              </label>
              <p className="text-body font-body text-subtext-color -mt-1 mb-2">
                {t('casePage.dialogs.requestEdit.notesDescription')}
              </p>
              <textarea
                id="userNote"
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                placeholder={t('casePage.dialogs.requestEdit.notesPlaceholder')}
                rows={4}
                disabled={saving}
                className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-vertical min-h-[100px] placeholder:text-subtext-color disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-caption font-caption text-subtext-color">
                {t('casePage.dialogs.requestEdit.notesHelp')}
              </span>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-body-bold font-body-bold text-amber-800">
              {t('casePage.dialogs.requestEdit.warningTitle')}
            </p>
            <p className="text-body font-body text-amber-700 mt-1">
              {t('casePage.dialogs.requestEdit.warningMessage')}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-neutral-border">
            <Button variant="neutral-secondary" onClick={handleClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button
              variant="brand-primary"
              icon={<FeatherEdit3 />}
              onClick={handleSubmit}
              disabled={saving || !hasChanges()}
            >
              {saving
                ? t('casePage.dialogs.requestEdit.submitting')
                : t('casePage.dialogs.requestEdit.submitButton')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestEditDialog;