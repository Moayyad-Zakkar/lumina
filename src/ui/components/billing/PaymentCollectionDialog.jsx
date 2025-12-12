import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';

// Use the new DialogWrapper instead of Dialog
import DialogWrapper from '../DialogWrapper';
import { TextField } from '../TextField';
import { Button } from '../Button';
import {
  FeatherDollarSign,
  FeatherCheck,
  FeatherPrinter,
} from '@subframe/core';

import {
  useDoctorCases,
  usePaymentProcessor,
} from '../../../hooks/useBillingData';

/* -------------------------------------------------------
   PrintableInvoice Component
------------------------------------------------------- */
export const PrintableInvoice = React.forwardRef(
  ({ paymentData, doctorInfo, selectedCasesData, paymentNotes }, ref) => {
    const { t } = useTranslation();
    const invoiceNumber = `INV-${Date.now()}`;
    const currentDate = new Date().toLocaleDateString();

    const statusDisplayText = {
      submitted: t('caseStatusBadge.submitted'),
      accepted: t('caseStatusBadge.accepted'),
      under_review: t('caseStatusBadge.underReview'),
      rejected: t('caseStatusBadge.rejected'),
      awaiting_patient_approval: t('caseStatusBadge.awaitingApproval'),
      patient_rejected: t('caseStatusBadge.patientRejected'),
      awaiting_user_approval: t('caseStatusBadge.awaitingApproval'),
      user_rejected: t('caseStatusBadge.userRejected'),
      approved: t('caseStatusBadge.approved'),
      in_production: t('caseStatusBadge.inProduction'),
      ready_for_delivery: t('caseStatusBadge.readyForDelivery'),
      delivered: t('caseStatusBadge.delivered'),
      completed: t('caseStatusBadge.completed'),
    };

    return (
      <div ref={ref} className="p-8 bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-brand-600 pb-4 mb-6">
          <div>
            <img
              className="h-10 flex-none object-cover"
              src={`${window.location.origin}/logo.png`}
              alt="Logo"
            />
            <p className="text-sm text-gray-600 mt-2">
              {t('paymentCollectionDialog.paymentReceipt')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              <strong>{t('paymentCollectionDialog.invoice')} #:</strong>{' '}
              {invoiceNumber}
            </p>
            <p className="text-sm text-gray-600">
              <strong>{t('transactions.table.date')}:</strong> {currentDate}
            </p>
          </div>
        </div>

        {/* Doctor Information */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {t('paymentCollectionDialog.doctorLabel')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {t('paymentCollectionDialog.name')}
                </p>
                <p className="text-sm text-gray-900">{doctorInfo.full_name}</p>
              </div>
              {doctorInfo.email && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {t('auth.email')}
                  </p>
                  <p className="text-sm text-gray-900">{doctorInfo.email}</p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {doctorInfo.clinic && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {t('casePage.clinic')}
                  </p>
                  <p className="text-sm text-gray-900">{doctorInfo.clinic}</p>
                </div>
              )}
              {doctorInfo.phone && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    {t('casePage.phone')}
                  </p>
                  <p className="text-sm text-gray-900">{doctorInfo.phone}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {t('paymentCollectionDialog.paymentSummary')}
          </h2>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                {t('paymentCollectionDialog.paymentAmount')}
              </span>
              <span className="text-lg font-bold text-gray-900">
                ${parseFloat(paymentData.amount).toFixed(2)}
              </span>
            </div>
            {paymentNotes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  {t('paymentCollectionDialog.notes')}
                </p>
                <p className="text-sm text-gray-700">{paymentNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Cases Breakdown */}
        {selectedCasesData.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {t('paymentCollectionDialog.casesIncluded')}
            </h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('cases.caseId')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('paymentCollectionDialog.patient')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('paymentCollectionDialog.statusLabel')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('casePage.treatmentPlan.totalCost')}
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('paymentCollectionDialog.paymentAmountLabel')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedCasesData.map((case_) => (
                    <tr key={case_.id}>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {t('doctorTransactions.case')} #{case_.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        {case_.first_name} {case_.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 text-center">
                        {statusDisplayText[case_.status] || case_.status}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-center">
                        ${parseFloat(case_.total_cost || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-center">
                        ${case_.paymentApplied.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan="4"
                      className="px-4 py-3 text-sm font-medium text-gray-900 text-center"
                    >
                      {t('paymentCollectionDialog.totalPayment')}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-center">
                      ${parseFloat(paymentData.amount).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
          <p>
            {t('adminTreatmentPlan.print.footer', {
              date: new Date().toLocaleString(),
            })}
          </p>
        </div>
      </div>
    );
  }
);

const PaymentCollectionDialog = ({
  isOpen,
  onClose,
  doctors,
  initialDoctor = null,
  refetchBillingData,
}) => {
  const { t } = useTranslation();
  const [selectedDoctor, setSelectedDoctor] = useState(initialDoctor);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [selectedCases, setSelectedCases] = useState(new Set());
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [lastPaymentData, setLastPaymentData] = useState(null);

  const printRef = useRef();

  const { doctorCases, loadingCases, loadDoctorCases } = useDoctorCases();
  const { processingPayment, processPayment } =
    usePaymentProcessor(refetchBillingData);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Payment-Invoice-${Date.now()}`,
  });

  // Reset form when dialog opens/closes or initial doctor changes
  useEffect(() => {
    if (isOpen) {
      setSelectedDoctor(initialDoctor);
      setSelectedCases(new Set());
      setPaymentAmount('');
      setPaymentNotes('');
      setShowPrintPreview(false);
      setLastPaymentData(null);
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
      // Prepare data for invoice
      const paymentAmountNum = parseFloat(paymentAmount);
      const selectedTotal = calculateSelectedCasesTotal();
      const remainingAmount = Math.max(0, paymentAmountNum - selectedTotal);
      const unselectedCases = getUnselectedCases();

      const selectedCasesData = doctorCases
        .filter((case_) => selectedCases.has(case_.id))
        .map((case_) => ({
          ...case_,
          paymentApplied: Math.min(case_.remainingAmount, paymentAmountNum),
        }));

      // Add unselected cases if there's remaining amount
      if (remainingAmount > 0 && unselectedCases.length > 0) {
        const perCaseAmount = remainingAmount / unselectedCases.length;
        unselectedCases.forEach((case_) => {
          selectedCasesData.push({
            ...case_,
            paymentApplied: Math.min(case_.remainingAmount, perCaseAmount),
          });
        });
      }

      setLastPaymentData({
        paymentData: {
          amount: paymentAmount,
          date: new Date().toISOString(),
        },
        doctorInfo: selectedDoctor,
        selectedCasesData,
        paymentNotes,
      });

      setShowPrintPreview(true);
    }
  };

  const handleClose = () => {
    setShowPrintPreview(false);
    setLastPaymentData(null);
    onClose();
  };

  const handlePrintAndClose = () => {
    handlePrint();
    setTimeout(() => {
      handleClose();
    }, 500);
  };

  // Show print preview after successful payment
  if (showPrintPreview && lastPaymentData) {
    return (
      <DialogWrapper
        isOpen={isOpen}
        onClose={handleClose}
        title={t('paymentCollectionDialog.paymentInvoice')}
        description={t('paymentCollectionDialog.paymentInvoiceDescription')}
        icon={<FeatherPrinter />}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-4 w-full pt-4">
          <div className="border border-neutral-border rounded-lg bg-white max-h-[60vh] overflow-y-auto">
            <PrintableInvoice
              ref={printRef}
              paymentData={lastPaymentData.paymentData}
              doctorInfo={lastPaymentData.doctorInfo}
              selectedCasesData={lastPaymentData.selectedCasesData}
              paymentNotes={lastPaymentData.paymentNotes}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-border w-full mt-6">
          <Button variant="neutral-secondary" onClick={handleClose}>
            {t('common.close')}
          </Button>
          <Button icon={<FeatherPrinter />} onClick={handlePrintAndClose}>
            {t('paymentCollectionDialog.printInvoice')}
          </Button>
        </div>
      </DialogWrapper>
    );
  }

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={handleClose}
      title={t('paymentCollectionDialog.title')}
      description={t('paymentCollectionDialog.subtitle')}
      icon={<FeatherDollarSign />}
      loading={processingPayment}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6 w-full pt-4">
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
    </DialogWrapper>
  );
};

const DoctorSelection = ({ doctors, selectedDoctor, onDoctorChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2 w-auto">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('paymentCollectionDialog.doctorLabel')} *
      </label>
      <select
        value={selectedDoctor?.id || ''}
        onChange={(e) => onDoctorChange(e.target.value)}
        className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        <option value="">
          {t('paymentCollectionDialog.doctorPlaceholder')}
        </option>
        {doctors
          .filter((doctor) => doctor.totalDueAmount > 0)
          .map((doctor) => (
            <option key={doctor.id} value={doctor.id}>
              {doctor.full_name} {doctor.clinic ? `(${doctor.clinic})` : ''} - $
              {doctor.totalDueAmount.toFixed(2)}{' '}
              {t('billing.table.paymentStatus.due')}
            </option>
          ))}
      </select>
    </div>
  );
};

const PaymentAmountInput = ({ paymentAmount, setPaymentAmount }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('paymentCollectionDialog.paymentAmountLabel')} *
      </label>
      <TextField>
        <TextField.Input
          type="number"
          min="0"
          step="0.01"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          placeholder={t('paymentCollectionDialog.paymentAmountPlaceholder')}
        />
      </TextField>
    </div>
  );
};

const PaymentNotesInput = ({ paymentNotes, setPaymentNotes }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-2">
      <label className="text-body-bold font-body-bold text-default-font">
        {t('paymentCollectionDialog.notesLabel')}
      </label>
      <textarea
        value={paymentNotes}
        onChange={(e) => setPaymentNotes(e.target.value)}
        placeholder={t('paymentCollectionDialog.notesPlaceholder')}
        rows={3}
        className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
      />
    </div>
  );
};

const CasesSection = ({
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

const CasesSectionHeader = ({ selectedCases, doctorCases }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between">
      <h3 className="text-heading-4 font-heading-4 text-default-font">
        {t('paymentCollectionDialog.unpaidCasesTitle')}
      </h3>
      {doctorCases.length > 0 && (
        <div className="text-sm text-subtext-color">
          {t('paymentCollectionDialog.selectedSummary', {
            selected: selectedCases.size,
            total: doctorCases.length,
          })}
        </div>
      )}
    </div>
  );
};

const PaymentStatusBadge = ({ paymentStatus, paymentPercentage }) => {
  const { t } = useTranslation();

  const paymentStatusConfig = {
    unpaid: {
      color: 'text-red-600 bg-red-50 border-red-200',
      text: t('billing.table.paymentStatus.unpaid'),
    },
    partially_paid: {
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      text: t('adminDoctorDetails.partialPayment', {
        percent: paymentPercentage.toFixed(0),
      }),
    },
    paid: {
      color: 'text-green-600 bg-green-50 border-green-200',
      text: t('billing.table.paymentStatus.paid'),
    },
    not_applicable: {
      color: 'text-gray-500 bg-gray-50 border-gray-200',
      text: t('billing.table.paymentStatus.na'),
    },
  };

  const config =
    paymentStatusConfig[paymentStatus] || paymentStatusConfig.unpaid;

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
  const { t } = useTranslation();

  if (loadingCases) {
    return (
      <div className="text-center py-8 text-neutral-500">
        {t('paymentCollectionDialog.loadingCases')}
      </div>
    );
  }

  if (doctorCases.length === 0) {
    return (
      <div className="text-center py-8 text-neutral-500 border border-neutral-border rounded-md">
        {t('paymentCollectionDialog.noUnpaidCases')}
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

const CaseItem = ({ case_, isSelected, onSelectionChange }) => {
  const { t } = useTranslation();

  const statusDisplayText = {
    submitted: t('caseStatusBadge.submitted'),
    accepted: t('caseStatusBadge.accepted'),
    under_review: t('caseStatusBadge.underReview'),
    rejected: t('caseStatusBadge.rejected'),
    awaiting_patient_approval: t('caseStatusBadge.awaitingApproval'),
    patient_rejected: t('caseStatusBadge.patientRejected'),
    awaiting_user_approval: t('caseStatusBadge.awaitingApproval'),
    user_rejected: t('caseStatusBadge.userRejected'),
    approved: t('caseStatusBadge.approved'),
    in_production: t('caseStatusBadge.inProduction'),
    ready_for_delivery: t('caseStatusBadge.readyForDelivery'),
    delivered: t('caseStatusBadge.delivered'),
    completed: t('caseStatusBadge.completed'),
  };

  return (
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
            {t('cases.caseId').replace('Case ID', 'Case')} #{case_.id} -{' '}
            {case_.first_name} {case_.last_name}
          </label>
          <div className="flex items-center gap-2">
            <PaymentStatusBadge
              paymentStatus={case_.paymentStatus}
              paymentPercentage={case_.paymentPercentage || 0}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-caption font-caption text-subtext-color">
            {t('paymentCollectionDialog.statusLabel')}:{' '}
            {statusDisplayText[case_.status] || case_.status} |{' '}
            {t('paymentCollectionDialog.createdLabel')}:{' '}
            {new Date(case_.created_at).toLocaleDateString()}
          </div>
          <div className="text-right">
            <div className="text-body-bold font-body-bold text-default-font">
              ${case_.remainingAmount.toFixed(2)}{' '}
              {t('paymentCollectionDialog.remainingShort')}
            </div>
            <div className="text-caption font-caption text-neutral-500">
              {t('paymentCollectionDialog.paidOfTotal', {
                paid: `$${case_.totalPaid?.toFixed(2) || '0.00'}`,
                total: `$${parseFloat(case_.total_cost || 0).toFixed(2)}`,
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PaymentSummary = ({
  calculateSelectedCasesTotal,
  paymentAmount,
  calculateRemainingAmount,
  getUnselectedCases,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-neutral-50 border border-neutral-border rounded-md p-4 space-y-2">
      <div className="flex justify-between text-body font-body">
        <span>{t('paymentCollectionDialog.selectedCasesTotal')}</span>
        <span className="font-bold">
          ${calculateSelectedCasesTotal().toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-body font-body">
        <span>{t('paymentCollectionDialog.paymentAmount')}</span>
        <span className="font-bold">
          ${parseFloat(paymentAmount || 0).toFixed(2)}
        </span>
      </div>
      <div className="flex justify-between text-body font-body border-t border-neutral-border pt-2">
        <span>{t('paymentCollectionDialog.remainingAmount')}</span>
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
          {t('paymentCollectionDialog.remainingSplitNote', {
            count: getUnselectedCases().length,
          })}
        </div>
      )}
    </div>
  );
};

const DialogActions = ({
  onClose,
  onSubmit,
  processingPayment,
  paymentAmount,
  selectedDoctor,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-neutral-border w-full mt-6">
      <Button
        variant="neutral-secondary"
        onClick={onClose}
        disabled={processingPayment}
      >
        {t('paymentCollectionDialog.cancel')}
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
        {processingPayment
          ? t('paymentCollectionDialog.processing')
          : t('paymentCollectionDialog.processPayment')}
      </Button>
    </div>
  );
};

export default PaymentCollectionDialog;
