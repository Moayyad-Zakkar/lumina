import { useState } from 'react';
import supabase from '../helper/supabaseClient';
import toast from 'react-hot-toast';

export const useCaseNotes = (caseData) => {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(caseData?.user_note || '');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const handleEditNote = () => {
    setIsEditingNote(true);
    setNoteError(null);
  };

  const handleCancelEditNote = () => {
    setIsEditingNote(false);
    setNoteText(caseData?.user_note || '');
    setNoteError(null);
  };

  const handleSaveNote = async () => {
    try {
      setNoteSaving(true);
      setNoteError(null);

      const { error: updateError } = await supabase
        .from('cases')
        .update({ user_note: noteText.trim() || null })
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      // Update local case data
      caseData.user_note = noteText.trim() || null;
      setIsEditingNote(false);
      toast.success('Note updated successfully');
    } catch (error) {
      console.error('Error saving note:', error);
      setNoteError(error.message || 'Failed to save note');
      toast.error('Failed to save note');
    } finally {
      setNoteSaving(false);
    }
  };

  return {
    isEditingNote,
    noteText,
    setNoteText,
    noteSaving,
    noteError,
    handleEditNote,
    handleCancelEditNote,
    handleSaveNote,
  };
};
