import React, { useState } from 'react';
import { Button } from '../Button';
import Error from '../Error';
import { FeatherEdit3, FeatherSave } from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

const AdminNotesSection = ({ caseData }) => {
  const [adminNote, setAdminNote] = useState(caseData?.admin_note || '');
  const [isEditingAdminNote, setIsEditingAdminNote] = useState(false);
  const [adminNoteBackup, setAdminNoteBackup] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const handleEditAdminNote = () => {
    setAdminNoteBackup(adminNote);
    setIsEditingAdminNote(true);
  };

  const handleCancelEditAdminNote = () => {
    setAdminNote(adminNoteBackup);
    setIsEditingAdminNote(false);
    setNoteError(null);
  };

  const handleSaveAdminNote = async () => {
    try {
      setSavingNote(true);
      setNoteError(null);
      const { error } = await supabase
        .from('cases')
        .update({ admin_note: adminNote })
        .eq('id', caseData.id);
      if (error) throw error;
      toast.success('Admin note saved');
      setIsEditingAdminNote(false);
    } catch (err) {
      setNoteError(err.message || 'Failed to save note');
      toast.error(err.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-center justify-between">
        <span className="text-heading-3 font-heading-3 text-default-font">
          3DA Notes
        </span>
        {!isEditingAdminNote && (
          <Button
            variant="neutral-secondary"
            size="small"
            icon={<FeatherEdit3 />}
            onClick={handleEditAdminNote}
          >
            {adminNote ? 'Edit Note' : 'Add Note'}
          </Button>
        )}
      </div>

      {noteError && (
        <div className="w-full">
          <Error error={noteError} />
        </div>
      )}

      <div className="w-full">
        {isEditingAdminNote ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="adminNoteTextarea"
                className="text-body-bold font-body-bold text-default-font"
              >
                Additional Notes
              </label>
              <textarea
                id="adminNoteTextarea"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Enter any special instructions, internal comments, etc..."
                rows={6}
                className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[120px] placeholder:text-subtext-color"
                disabled={savingNote}
              />
              <span className="text-caption font-caption text-subtext-color">
                Add any additional information or internal notes about this
                case.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                icon={<FeatherSave />}
                onClick={handleSaveAdminNote}
                disabled={savingNote}
                size="small"
              >
                {savingNote ? 'Saving...' : 'Save Note'}
              </Button>
              <Button
                variant="neutral-secondary"
                onClick={handleCancelEditAdminNote}
                disabled={savingNote}
                size="small"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-full">
            {adminNote ? (
              <div className="w-full bg-white border border-neutral-200 rounded-md p-4 shadow-sm">
                <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                  {adminNote}
                </div>
              </div>
            ) : (
              <div className="w-full bg-neutral-50 text-sm text-neutral-500 rounded-md p-3">
                No lab notes added yet.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminNotesSection;
