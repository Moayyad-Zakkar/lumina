import React, { useState } from 'react';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { FeatherDollarSign, FeatherCheck } from '@subframe/core';
import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import DialogWrapper from '../DialogWrapper';

const CreditDialog = ({ isOpen, onClose, refetchBillingData }) => {
  const { t } = useTranslation();
  const [creditAmount, setCreditAmount] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [processingCredit, setProcessingCredit] = useState(false);

  const handleClose = () => {
    setCreditAmount('');
    setCreditNotes('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      toast.error(t('creditDialog.errors.validCredit'));
      return;
    }

    try {
      setProcessingCredit(true);

      const creditAmountNum = parseFloat(creditAmount);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create credit record in payments table with type 'payment'
      const { error: creditError } = await supabase.from('payments').insert({
        doctor_id: null, // No doctor associated with general credits
        amount: creditAmountNum,
        admin_id: user.id,
        notes: creditNotes.trim() || null,
        type: 'payment', // Credit counts as income/payment received
      });

      if (creditError) throw creditError;

      toast.success(t('creditDialog.success.creditRecorded'));
      handleClose();

      // Refresh billing data
      setTimeout(() => {
        refetchBillingData();
      }, 1000);
    } catch (err) {
      console.error('Credit recording failed:', err);
      toast.error(err.message || t('creditDialog.errors.recordFailed'));
    } finally {
      setProcessingCredit(false);
    }
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={t('creditDialog.title')}
      description={t('creditDialog.subtitle')}
      icon={<FeatherDollarSign />}
      iconColor="text-success-600"
      iconBgColor="bg-success-100"
      maxWidth="max-w-lg"
      loading={processingCredit}
    >
      <div className="space-y-6 w-full pt-4">
        <CreditAmountInput
          creditAmount={creditAmount}
          setCreditAmount={setCreditAmount}
        />
        <CreditNotesInput
          creditNotes={creditNotes}
          setCreditNotes={setCreditNotes}
        />
      </div>
      <DialogActions
        onClose={handleClose}
        onSubmit={handleSubmit}
        processingCredit={processingCredit}
        creditAmount={creditAmount}
      />
    </DialogWrapper>
  );
};

const CreditAmountInput = ({ creditAmount, setCreditAmount }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('creditDialog.creditAmount')}
      </label>
      <TextField>
        <TextField.Input
          type="number"
          min="0"
          step="0.01"
          value={creditAmount}
          onChange={(e) => setCreditAmount(e.target.value)}
          placeholder="0.00"
        />
      </TextField>
    </div>
  );
};

const CreditNotesInput = ({ creditNotes, setCreditNotes }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('creditDialog.description')}
      </label>
      <textarea
        value={creditNotes}
        onChange={(e) => setCreditNotes(e.target.value)}
        placeholder={t('creditDialog.descriptionPlaceholder')}
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
  processingCredit,
  creditAmount,
}) => {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-border w-full">
      <Button
        variant="neutral-secondary"
        onClick={onClose}
        disabled={processingCredit}
      >
        {t('common.cancel')}
      </Button>
      <Button
        onClick={onSubmit}
        disabled={
          processingCredit || !creditAmount || parseFloat(creditAmount) <= 0
        }
        icon={<FeatherCheck />}
        variant="brand-primary"
      >
        {processingCredit
          ? t('creditDialog.recording')
          : t('creditDialog.recordCredit')}
      </Button>
    </div>
  );
};

export default CreditDialog;
