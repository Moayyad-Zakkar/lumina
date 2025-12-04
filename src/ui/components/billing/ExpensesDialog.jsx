import React, { useState } from 'react';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { FeatherDollarSign, FeatherCheck } from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import DialogWrapper from '../DialogWrapper';

const ExpensesDialog = ({ isOpen, onClose, refetchBillingData }) => {
  const { t } = useTranslation();
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [processingExpense, setProcessingExpense] = useState(false);

  const handleClose = () => {
    setExpenseAmount('');
    setExpenseNotes('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) {
      toast.error(t('expenseDialog.errors.validExpense'));
      return;
    }

    try {
      setProcessingExpense(true);

      const expenseAmountNum = parseFloat(expenseAmount);
      const {
        data: { user },
      } = await supabase.auth.getUser(); // Create expense record in payments table with type 'expense'

      const { error: expenseError } = await supabase.from('payments').insert({
        doctor_id: null, // No doctor associated with general expenses
        amount: expenseAmountNum,
        admin_id: user.id,
        notes: expenseNotes.trim() || null,
        type: 'expense', // New column to differentiate from 'payment' (received)
      });

      if (expenseError) throw expenseError;

      toast.success(t('expenseDialog.success.expenseRecorded'));
      handleClose(); // Refresh billing data

      setTimeout(() => {
        refetchBillingData();
      }, 1000);
    } catch (err) {
      console.error('Expense recording failed:', err);
      toast.error(err.message || t('expense.errors.recordFailed'));
    } finally {
      setProcessingExpense(false);
    }
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={t('expenseDialog.title')}
      description={t('expenseDialog.subtitle')}
      icon={<FeatherDollarSign />}
      iconColor="text-error-600"
      iconBgColor="bg-error-100"
      maxWidth="max-w-lg"
      loading={processingExpense}
    >
      {/* Content starts here, DialogHeader is no longer needed */}
      <div className="space-y-6 w-full pt-4">
        <ExpenseAmountInput
          expenseAmount={expenseAmount}
          setExpenseAmount={setExpenseAmount}
        />
        <ExpenseNotesInput
          expenseNotes={expenseNotes}
          setExpenseNotes={setExpenseNotes}
        />
      </div>
      <DialogActions
        onClose={handleClose}
        onSubmit={handleSubmit}
        processingExpense={processingExpense}
        expenseAmount={expenseAmount}
      />
    </DialogWrapper>
  );
};

// Removed DialogHeader

const ExpenseAmountInput = ({ expenseAmount, setExpenseAmount }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('expenseDialog.expenseAmount')}
      </label>
      <TextField>
        <TextField.Input
          type="number"
          min="0"
          step="0.01"
          value={expenseAmount}
          onChange={(e) => setExpenseAmount(e.target.value)}
          placeholder="0.00"
        />
      </TextField>
    </div>
  );
};

const ExpenseNotesInput = ({ expenseNotes, setExpenseNotes }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('expenseDialog.description')}
      </label>
      <textarea
        value={expenseNotes}
        onChange={(e) => setExpenseNotes(e.target.value)}
        placeholder={t('expenseDialog.descriptionPlaceholder')}
        rows={4}
        className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
        required
      />
    </div>
  );
};

const DialogActions = ({
  onClose,
  onSubmit,
  processingExpense,
  expenseAmount,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-border w-full">
      <Button
        variant="neutral-secondary"
        onClick={onClose}
        disabled={processingExpense}
      >
        {t('common.cancel')}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={
          processingExpense || !expenseAmount || parseFloat(expenseAmount) <= 0
        }
        icon={<FeatherCheck />}
        variant="destructive-primary"
      >
        {processingExpense
          ? t('expenseDialog.recording')
          : t('expenseDialog.recordExpense')}
      </Button>
    </div>
  );
};

export default ExpensesDialog;
