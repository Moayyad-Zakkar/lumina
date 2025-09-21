import React, { useState, useEffect } from 'react';

import { TextField } from '..//TextField';
import { Dialog } from '../Dialog';
import { Button } from '../Button';
import { FeatherDollarSign, FeatherCheck, FeatherX } from '@subframe/core';
import {
  useDoctorCases,
  usePaymentProcessor,
} from '../../../hooks/useBillingData';
import { IconButton } from '../IconButton';

const PaymentCollectionDialog = ({
  isOpen,
  onClose,
  doctors,
  initialDoctor = null,
  refetchBillingData,
}) => {
  const [selectedDoctor, setSelectedDoctor] = useState(initialDoctor);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedCases, setSelectedCases] = useState(new Set());

  const { doctorCases, loadingCases, loadDoctorCases } = useDoctorCases();
  const { processingPayment, processPayment } =
    usePaymentProcessor(refetchBillingData);

  // Reset form when dialog opens/closes or initial doctor changes
  useEffect(() => {
    if (isOpen) {
      setSelectedDoctor(initialDoctor);
      setSelectedCases(new Set());
      setPaymentAmount('');
      setPaymentNotes('');
      if (initialDoctor) {
        loadDoctorCases(initialDoctor.id);
      }
    }
  }, [isOpen, initialDoctor, loadDoctorCases]);

  const handleDoctorChange = async (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId) || null;
    setSelectedDoctor(doctor);
    setSelectedCases(new Set());
    await loadDoctorCases(doctorId);
  };

  const handleCaseSelection = (caseId, checked) => {
    const newSelectedCases = new Set(selectedCases);
    if (checked) {
      newSelectedCases.add(caseId);
    } else {
      newSelectedCases.delete(caseId);
    }
    setSelectedCases(newSelectedCases);
  };

  const calculateSelectedCasesTotal = () => {
    return doctorCases
      .filter((case_) => selectedCases.has(case_.id))
      .reduce((sum, case_) => sum + case_.remainingAmount, 0);
  };

  const calculateRemainingAmount = () => {
    const selectedTotal = calculateSelectedCasesTotal();
    const paymentAmountNum = parseFloat(paymentAmount || 0);
    return Math.max(0, paymentAmountNum - selectedTotal);
  };

  const getUnselectedCases = () => {
    return doctorCases.filter((case_) => !selectedCases.has(case_.id));
  };

  const handleSubmit = async () => {
    const success = await processPayment({
      selectedDoctor,
      paymentAmount,
      selectedCases,
      doctorCases,
      paymentNotes,
    });

    if (success) {
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDoctor(null);
    setSelectedCases(new Set());
    setPaymentAmount('');
    setPaymentNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content className="p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader onClose={handleClose} />

        <div className="space-y-6 w-full">
          <DoctorSelection
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            onDoctorChange={handleDoctorChange}
          />

          <PaymentAmountInput
            paymentAmount={paymentAmount}
            setPaymentAmount={setPaymentAmount}
          />

          <PaymentNotesInput
            paymentNotes={paymentNotes}
            setPaymentNotes={setPaymentNotes}
          />

          {selectedDoctor && (
            <CasesSection
              selectedDoctor={selectedDoctor}
              doctorCases={doctorCases}
              loadingCases={loadingCases}
              selectedCases={selectedCases}
              handleCaseSelection={handleCaseSelection}
              paymentAmount={paymentAmount}
              calculateSelectedCasesTotal={calculateSelectedCasesTotal}
              calculateRemainingAmount={calculateRemainingAmount}
              getUnselectedCases={getUnselectedCases}
            />
          )}
        </div>

        <DialogActions
          onClose={handleClose}
          onSubmit={handleSubmit}
          processingPayment={processingPayment}
          paymentAmount={paymentAmount}
          selectedDoctor={selectedDoctor}
        />
      </Dialog.Content>
    </Dialog>
  );
};

const DialogHeader = ({ onClose }) => (
  <>
    <div className="flex items-start gap-6 mb-6">
      <>
        <FeatherDollarSign className="h-6 w-6 text-brand-600 mt-1" />
        <div>
          <h2 className="text-heading-3 font-heading-3 text-default-font">
            Collect Payment
          </h2>
          <p className="text-body font-body text-subtext-color mt-1">
            Enter payment details and select cases to allocate the payment.
          </p>
        </div>
      </>
      <IconButton icon={<FeatherX />} onClick={onClose} />
    </div>
  </>
);

const DoctorSelection = ({ doctors, selectedDoctor, onDoctorChange }) => (
  <div className="flex flex-col gap-2 w-auto">
    <label className="text-body-bold font-body-bold text-default-font">
      Doctor *
    </label>
    <select
      value={selectedDoctor?.id || ''}
      onChange={(e) => onDoctorChange(e.target.value)}
      className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    >
      <option value="">Select a doctor...</option>
      {doctors
        .filter((doctor) => doctor.totalDueAmount > 0)
        .map((doctor) => (
          <option key={doctor.id} value={doctor.id}>
            {doctor.full_name} {doctor.clinic ? `(${doctor.clinic})` : ''} - $
            {doctor.totalDueAmount.toFixed(2)} due
          </option>
        ))}
    </select>
  </div>
);

const PaymentAmountInput = ({ paymentAmount, setPaymentAmount }) => (
  <div className="flex flex-col gap-2">
    <label className="text-body-bold font-body-bold text-default-font">
      Payment Amount *
    </label>
    <TextField>
      <TextField.Input
        type="number"
        min="0"
        step="0.01"
        value={paymentAmount}
        onChange={(e) => setPaymentAmount(e.target.value)}
        placeholder="0.00"
      />
    </TextField>
  </div>
);

const PaymentNotesInput = ({ paymentNotes, setPaymentNotes }) => (
  <div className="flex flex-col gap-2">
    <label className="text-body-bold font-body-bold text-default-font">
      Notes (Optional)
    </label>
    <textarea
      value={paymentNotes}
      onChange={(e) => setPaymentNotes(e.target.value)}
      placeholder="Add any notes about this payment..."
      rows={3}
      className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
    />
  </div>
);

const CasesSection = ({
  selectedDoctor,
  doctorCases,
  loadingCases,
  selectedCases,
  handleCaseSelection,
  paymentAmount,
  calculateSelectedCasesTotal,
  calculateRemainingAmount,
  getUnselectedCases,
}) => (
  <div className="space-y-4">
    <CasesSectionHeader
      selectedCases={selectedCases}
      doctorCases={doctorCases}
    />

    <CasesList
      doctorCases={doctorCases}
      loadingCases={loadingCases}
      selectedCases={selectedCases}
      handleCaseSelection={handleCaseSelection}
    />

    {paymentAmount && doctorCases.length > 0 && (
      <PaymentSummary
        calculateSelectedCasesTotal={calculateSelectedCasesTotal}
        paymentAmount={paymentAmount}
        calculateRemainingAmount={calculateRemainingAmount}
        getUnselectedCases={getUnselectedCases}
      />
    )}
  </div>
);

const CasesSectionHeader = ({ selectedCases, doctorCases }) => (
  <div className="flex items-center justify-between">
    <h3 className="text-heading-4 font-heading-4 text-default-font">
      Unpaid Cases
    </h3>
    {doctorCases.length > 0 && (
      <div className="text-sm text-subtext-color">
        {selectedCases.size} of {doctorCases.length} selected
      </div>
    )}
  </div>
);

const statusDisplayText = {
  submitted: 'Submitted',
  accepted: 'Accepted',
  under_review: 'Under Review',
  rejected: 'Rejected',
  awaiting_patient_approval: 'Awaiting Approval',
  patient_rejected: 'Rejected by Patient',
  awaiting_user_approval: 'Awaiting Approval',
  user_rejected: 'Rejected by Doctor',
  approved: 'Approved',
  in_production: 'In Production',
  ready_for_delivery: 'Ready for Delivery',
  delivered: 'Delivered',
  completed: 'Completed',
};

// Enhanced payment status badges
const PaymentStatusBadge = ({ status, paymentPercentage }) => {
  const statusConfig = {
    unpaid: {
      color: 'text-red-600 bg-red-50 border-red-200',
      text: 'Unpaid',
    },
    partially_paid: {
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      text: `${paymentPercentage.toFixed(0)}% Paid`,
    },
    paid: {
      color: 'text-green-600 bg-green-50 border-green-200',
      text: 'Paid',
    },
    not_applicable: {
      color: 'text-gray-500 bg-gray-50 border-gray-200',
      text: 'N/A',
    },
  };

  const config = statusConfig[status] || statusConfig.unpaid;

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}
    >
      {config.text}
    </span>
  );
};

const CasesList = ({
  doctorCases,
  loadingCases,
  selectedCases,
  handleCaseSelection,
}) => {
  if (loadingCases) {
    return (
      <div className="text-center py-8 text-neutral-500">Loading cases...</div>
    );
  }

  if (doctorCases.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 border border-neutral-border rounded-md">
        No unpaid cases found for this doctor.
      </div>
    );
  }

  return (
    <div className="border border-neutral-border rounded-md max-h-60 overflow-y-auto">
      {doctorCases.map((case_) => (
        <CaseItem
          key={case_.id}
          case_={case_}
          isSelected={selectedCases.has(case_.id)}
          onSelectionChange={handleCaseSelection}
        />
      ))}
    </div>
  );
};

const CaseItem = ({ case_, isSelected, onSelectionChange }) => (
  <div className="flex items-center gap-3 p-3 border-b border-neutral-border last:border-b-0 hover:bg-neutral-50">
    <input
      type="checkbox"
      id={`case-${case_.id}`}
      checked={isSelected}
      onChange={(e) => onSelectionChange(case_.id, e.target.checked)}
      className="w-4 h-4 text-brand-600 border-neutral-border rounded focus:ring-brand-500"
    />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <label
          htmlFor={`case-${case_.id}`}
          className="text-body font-body text-default-font cursor-pointer"
        >
          Case #{case_.id} - {case_.first_name} {case_.last_name}
        </label>
        <div className="flex items-center gap-2">
          <PaymentStatusBadge
            status={case_.status}
            paymentPercentage={case_.paymentPercentage || 0}
          />
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-caption font-caption text-subtext-color">
          Status: {statusDisplayText[case_.status]} | Created:{' '}
          {new Date(case_.created_at).toLocaleDateString()}
        </div>
        <div className="text-right">
          <div className="text-body-bold font-body-bold text-default-font">
            ${case_.remainingAmount.toFixed(2)} remaining
          </div>
          <div className="text-caption font-caption text-neutral-500">
            ${case_.totalPaid?.toFixed(2) || '0.00'} paid of $
            {parseFloat(case_.total_cost || 0).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const PaymentSummary = ({
  calculateSelectedCasesTotal,
  paymentAmount,
  calculateRemainingAmount,
  getUnselectedCases,
}) => (
  <div className="bg-neutral-50 border border-neutral-border rounded-md p-4 space-y-2">
    <div className="flex justify-between text-body font-body">
      <span>Selected Cases Total:</span>
      <span className="font-bold">
        ${calculateSelectedCasesTotal().toFixed(2)}
      </span>
    </div>
    <div className="flex justify-between text-body font-body">
      <span>Payment Amount:</span>
      <span className="font-bold">
        ${parseFloat(paymentAmount || 0).toFixed(2)}
      </span>
    </div>
    <div className="flex justify-between text-body font-body border-t border-neutral-border pt-2">
      <span>Remaining Amount:</span>
      <span
        className={`font-bold ${
          calculateRemainingAmount() > 0
            ? 'text-warning-600'
            : 'text-success-600'
        }`}
      >
        ${calculateRemainingAmount().toFixed(2)}
      </span>
    </div>
    {calculateRemainingAmount() > 0 && getUnselectedCases().length > 0 && (
      <div className="text-caption font-caption text-subtext-color">
        Remaining amount will be split among {getUnselectedCases().length}{' '}
        unselected cases
      </div>
    )}
  </div>
);

const DialogActions = ({
  onClose,
  onSubmit,
  processingPayment,
  paymentAmount,
  selectedDoctor,
}) => (
  <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-border w-full">
    <Button
      variant="neutral-secondary"
      onClick={onClose}
      disabled={processingPayment}
    >
      Cancel
    </Button>
    <Button
      onClick={onSubmit}
      disabled={
        processingPayment ||
        !paymentAmount ||
        parseFloat(paymentAmount) <= 0 ||
        !selectedDoctor
      }
      icon={<FeatherCheck />}
    >
      {processingPayment ? 'Processing...' : 'Process Payment'}
    </Button>
  </div>
);

export default PaymentCollectionDialog;
