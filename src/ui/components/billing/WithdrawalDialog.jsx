import React, { useState } from 'react';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { FeatherCheck, FeatherDollarSign } from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import DialogWrapper from '../DialogWrapper';

const WithdrawalDialog = ({ isOpen, onClose, refetchBillingData }) => {
  const { t } = useTranslation();
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleClose = () => {
    setWithdrawalAmount('');
    setWithdrawalNotes('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast.error(t('withdrawalDialog.errors.validAmount'));
      return;
    }

    try {
      setProcessing(true);

      const amount = parseFloat(withdrawalAmount);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Store as negative amount with type 'withdrawal' — excluded from expenses
      const { error } = await supabase.from('payments').insert({
        doctor_id: null,
        amount: -Math.abs(amount), // always negative
        admin_id: user.id,
        notes: withdrawalNotes.trim() || null,
        type: 'withdrawal',
      });

      if (error) throw error;

      toast.success(t('withdrawalDialog.success.recorded'));
      handleClose();

      setTimeout(() => {
        refetchBillingData();
      }, 1000);
    } catch (err) {
      console.error('Withdrawal recording failed:', err);
      toast.error(err.message || t('withdrawalDialog.errors.recordFailed'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={t('withdrawalDialog.title')}
      description={t('withdrawalDialog.subtitle')}
      icon={<FeatherDollarSign />}
      iconColor="text-warning-600"
      iconBgColor="bg-warning-100"
      maxWidth="max-w-lg"
      loading={processing}
    >
      <div className="space-y-6 w-full pt-4">
        <WithdrawalAmountInput
          withdrawalAmount={withdrawalAmount}
          setWithdrawalAmount={setWithdrawalAmount}
        />
        <WithdrawalNotesInput
          withdrawalNotes={withdrawalNotes}
          setWithdrawalNotes={setWithdrawalNotes}
        />
      </div>
      <DialogActions
        onClose={handleClose}
        onSubmit={handleSubmit}
        processing={processing}
        withdrawalAmount={withdrawalAmount}
      />
    </DialogWrapper>
  );
};

const WithdrawalAmountInput = ({ withdrawalAmount, setWithdrawalAmount }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('withdrawalDialog.amount')}
      </label>
      <TextField>
        <TextField.Input
          type="number"
          min="0"
          step="0.01"
          value={withdrawalAmount}
          onChange={(e) => setWithdrawalAmount(e.target.value)}
          placeholder="0.00"
        />
      </TextField>
      {withdrawalAmount && parseFloat(withdrawalAmount) > 0 && (
        <p className="text-caption font-caption text-warning-700">
          {t('withdrawalDialog.willBeRecorded', {
            amount: parseFloat(withdrawalAmount).toFixed(2),
          })}
        </p>
      )}
    </div>
  );
};

const WithdrawalNotesInput = ({ withdrawalNotes, setWithdrawalNotes }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('withdrawalDialog.description')}
      </label>
      <textarea
        value={withdrawalNotes}
        onChange={(e) => setWithdrawalNotes(e.target.value)}
        placeholder={t('withdrawalDialog.descriptionPlaceholder')}
        rows={4}
        className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-warning-500 focus:border-warning-500 resize-vertical"
      />
    </div>
  );
};

const DialogActions = ({ onClose, onSubmit, processing, withdrawalAmount }) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-border w-full">
      <Button
        variant="neutral-secondary"
        onClick={onClose}
        disabled={processing}
      >
        {t('common.cancel')}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={
          processing || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0
        }
        icon={<FeatherCheck />}
        // Use inline style for orange since it's outside the standard brand variants
        className="bg-warning-600 hover:bg-warning-700 text-white border-0"
      >
        {processing
          ? t('withdrawalDialog.recording')
          : t('withdrawalDialog.recordWithdrawal')}
      </Button>
    </div>
  );
};

export default WithdrawalDialog;