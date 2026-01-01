import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReactToPrint } from 'react-to-print';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { DataFieldHorizontal } from '../DataFieldHorizontal';
import { Badge } from '../Badge';
import { IconButton } from '../IconButton';
import { Dialog } from '../Dialog';
import IPRChartViewer, { PrintableIPRChart } from '../IPRChartViewer';
import {
  FeatherGrid,
  FeatherClock,
  FeatherDollarSign,
  FeatherFileText,
  FeatherTruck,
  FeatherEdit2,
  FeatherCheck,
  FeatherImage,
  FeatherEye,
  FeatherCopy,
  FeatherSlice,
  FeatherPrinter,
} from '@subframe/core';
import TreatmentPlanImagesUpload from './TreatmentPlanImagesUpload';
import IPRChartDialog from './IPRChartDialog';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import { useIsMobile } from '../../../hooks/useIsMobile';

/* -------------------------------------------------------
   PrintField Component
------------------------------------------------------- */
const PrintField = ({ label, value }) => {
  const { i18n } = useTranslation();
  // i18n.dir() returns 'rtl' or 'ltr' based on the active language
  const isRTL = i18n.dir() === 'rtl';

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="text-start">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-sm text-gray-900">{value}</p>
    </div>
  );
};

/* -------------------------------------------------------
   PrintableTreatmentPlan Component
------------------------------------------------------- */
const PrintableTreatmentPlan = React.forwardRef(
  (
    {
      caseData,
      upperJawAligners,
      lowerJawAligners,
      estimatedDurationMonths,
      iprData,
    },
    ref
  ) => {
    const { t } = useTranslation();
    const hasIPRData = iprData && Object.keys(iprData).length > 0;

    return (
      <div ref={ref} className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-brand-600 pb-4 mb-6">
          <div>
            <img
              className="h-10 flex-none object-cover"
              src={`${window.location.origin}/logo.png`}
            />
            <p className="text-sm text-gray-600">
              {t('adminTreatmentPlan.print.treatmentPlanDetails')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {t('cases.caseId')}: <strong>CASE-{caseData.id}</strong>
            </p>
            <p className="text-sm text-gray-600">
              {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {t('casePage.patientInformation')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <PrintField
                label={t('casePage.firstName')}
                value={capitalizeFirstSafe(caseData.first_name) || 'N/A'}
              />
              <PrintField
                label={t('casePage.lastName')}
                value={capitalizeFirstSafe(caseData.last_name) || 'N/A'}
              />
            </div>
            <div className="space-y-3">
              <PrintField
                label={t('casePage.doctorName')}
                value={
                  capitalizeFirstSafe(caseData.profiles?.full_name) || 'N/A'
                }
              />
              <PrintField
                label={t('casePage.clinic')}
                value={caseData.profiles?.clinic || 'N/A'}
              />
            </div>
          </div>
        </div>

        {/* Treatment Plan Details */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {t('casePage.treatmentPlanReview')}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <PrintField
                label={t('casePage.alignerMaterial')}
                value={caseData.aligner_material || t('casePage.notSpecified')}
              />
              <PrintField
                label={t('casePage.treatmentPlan.upperJawAligners')}
                value={`${upperJawAligners || '—'} ${t(
                  'casePage.treatmentPlan.aligners'
                )}`}
              />
            </div>
            <div className="space-y-3">
              <PrintField
                label={t('casePage.treatmentPlan.lowerJawAligners')}
                value={`${lowerJawAligners || '—'} ${t(
                  'casePage.treatmentPlan.aligners'
                )}`}
              />
              <PrintField
                label={t('casePage.treatmentPlan.estimatedDuration')}
                value={`${estimatedDurationMonths || '—'} ${t(
                  'casePage.treatmentPlan.months'
                )}`}
              />
            </div>
          </div>
        </div>

        {/* IPR Chart Section */}
        {hasIPRData && (
          <div className="mb-6 page-break-inside-avoid">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              {t('adminTreatmentPlan.iprChart')}
            </h2>
            <div className="border border-gray-300 rounded-lg p-4 bg-white overflow-hidden flex justify-center">
              <PrintableIPRChart
                toothStatus={caseData.tooth_status || {}}
                iprData={iprData}
              />
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

const AdminTreatmentPlanEditor = ({
  caseData,
  currentStatus,
  isEditingPlan,
  upperJawAligners,
  setUpperJawAligners,
  lowerJawAligners,
  setLowerJawAligners,
  estimatedDurationMonths,
  setEstimatedDurationMonths,
  caseStudyFee,
  alignersPrice,
  setAlignersPrice,
  deliveryCharges,
  setDeliveryCharges,
  alignerUnitPrice,
  isDisabled,
  handleStartEdit,
  handleCancelEdit,
  handleSendForApproval,
  handleDecline,
  caseHasViewer,
  handleViewerClick,
  viewerLink,
  // New IPR props
  iprData = {},
  onIPRSave,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isIPRDialogOpen, setIsIPRDialogOpen] = useState(false);
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [isIPRViewerOpen, setIsIPRViewerOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const printRef = useRef();

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Case-${caseData.id}-Treatment-Plan`,
  });

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(viewerLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleIPRSave = async (data) => {
    if (onIPRSave) {
      await onIPRSave(data);
    }
  };

  // Only show for accepted cases and beyond
  if (
    ![
      'accepted',
      'user_rejected',
      'awaiting_user_approval',
      'approved',
      'in_production',
      'ready_for_delivery',
      'delivered',
      'completed',
    ].includes(currentStatus)
  ) {
    return null;
  }

  const totalCost =
    parseFloat(caseStudyFee || 0) +
    parseFloat(alignersPrice || 0) +
    parseFloat(deliveryCharges || 0);

  const hasIPRData = Object.keys(iprData).length > 0;

  // Check if we're in read-only mode
  const isReadOnly = isEditingPlan
    ? [
        'approved',
        'in_production',
        'ready_for_delivery',
        'delivered',
        'completed',
        'user_rejected',
      ].includes(currentStatus)
    : true;

  return (
    <>
      <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
        <div className="flex w-full flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <span className="text-heading-3 font-heading-3 text-default-font">
            {t('casePage.treatmentPlanReview')}
          </span>

          {/* Print Button - Only show in read-only mode */}
          {!isMobile && isReadOnly && (
            <Button
              size="small"
              variant="neutral-secondary"
              icon={<FeatherPrinter />}
              onClick={() => setIsPrintDialogOpen(true)}
            >
              {t('adminTreatmentPlan.printButton')}
            </Button>
          )}
        </div>

        <div className="flex w-full flex-col gap-6 md:flex-row md:flex-wrap">
          <div className="w-full md:flex md:gap-6">
            <div className="w-full md:flex-1 flex flex-col gap-4">
              {isEditingPlan &&
              ![
                'approved',
                'in_production',
                'ready_for_delivery',
                'delivered',
                'completed',
                'user_rejected',
              ].includes(currentStatus) ? (
                <>
                  <div className="flex items-center gap-2 text-caption-bold font-caption-bold text-default-font">
                    {t('casePage.alignerMaterial')}:
                    <Badge>
                      {caseData.aligner_material} ({alignerUnitPrice}$)
                    </Badge>
                  </div>

                  <TextField
                    label={t('casePage.treatmentPlan.upperJawAligners')}
                  >
                    <TextField.Input
                      type="number"
                      min={1}
                      value={upperJawAligners}
                      onChange={(e) => setUpperJawAligners(e.target.value)}
                    />
                  </TextField>
                  <TextField
                    label={t('casePage.treatmentPlan.lowerJawAligners')}
                  >
                    <TextField.Input
                      type="number"
                      min={1}
                      value={lowerJawAligners}
                      onChange={(e) => setLowerJawAligners(e.target.value)}
                    />
                  </TextField>
                  <TextField
                    label={t('adminTreatmentPlan.estimatedDurationLabel')}
                  >
                    <TextField.Input
                      type="number"
                      min={1}
                      value={estimatedDurationMonths}
                      onChange={(e) =>
                        setEstimatedDurationMonths(e.target.value)
                      }
                    />
                  </TextField>

                  {/* Action Buttons */}
                  {!isMobile && (
                    <div className="flex w-auto flex-col gap-2 text-caption-bold font-caption-bold text-default-font">
                      {t('adminTreatmentPlan.actionButtons')}:
                      <Button
                        variant="neutral-secondary"
                        icon={<FeatherImage />}
                        onClick={() => setIsUploadDialogOpen(true)}
                        size="small"
                        className="flex-2"
                      >
                        {t('adminTreatmentPlan.addViewer')}
                      </Button>
                      <Button
                        variant={
                          hasIPRData ? 'brand-secondary' : 'neutral-secondary'
                        }
                        icon={<FeatherSlice />}
                        onClick={() => setIsIPRDialogOpen(true)}
                        size="small"
                        className="flex-2"
                      >
                        {hasIPRData
                          ? t('adminTreatmentPlan.editIPRChart')
                          : t('adminTreatmentPlan.addIPRChart')}
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label={t('casePage.treatmentPlan.upperJawAligners')}
                  >
                    <Badge>
                      {upperJawAligners || '—'}{' '}
                      {t('casePage.treatmentPlan.aligners')}
                    </Badge>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label={t('casePage.treatmentPlan.lowerJawAligners')}
                  >
                    <Badge>
                      {lowerJawAligners || '—'}{' '}
                      {t('casePage.treatmentPlan.aligners')}
                    </Badge>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherClock />}
                    label={t('casePage.treatmentPlan.estimatedDuration')}
                  >
                    <span className="whitespace-nowrap text-body font-body text-default-font">
                      {estimatedDurationMonths || '—'}{' '}
                      {t('casePage.treatmentPlan.months')}
                    </span>
                  </DataFieldHorizontal>
                  {hasIPRData && (
                    <DataFieldHorizontal
                      icon={<FeatherSlice />}
                      label={t('adminTreatmentPlan.iprChart')}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="brand">
                          {t('adminTreatmentPlan.available')}
                        </Badge>
                        <Button
                          size="small"
                          variant="neutral-secondary"
                          onClick={() => setIsIPRViewerOpen(true)}
                        >
                          {t('adminTreatmentPlan.viewChart')}
                        </Button>
                      </div>
                    </DataFieldHorizontal>
                  )}
                </>
              )}
            </div>
            <div className="w-full md:flex-1 flex flex-col gap-4">
              {isEditingPlan &&
              ![
                'approved',
                'in_production',
                'ready_for_delivery',
                'delivered',
                'completed',
                'user_rejected',
              ].includes(currentStatus) ? (
                <>
                  <TextField
                    label={t('casePage.treatmentPlan.caseStudyFee')}
                    disabled
                  >
                    <TextField.Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={caseStudyFee}
                      placeholder="0.00"
                      disabled
                    />
                  </TextField>
                  <TextField label={t('casePage.treatmentPlan.alignersPrice')}>
                    <TextField.Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={alignersPrice}
                      onChange={(e) => setAlignersPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </TextField>
                  <TextField
                    label={t('casePage.treatmentPlan.deliveryCharges')}
                  >
                    <TextField.Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={deliveryCharges}
                      onChange={(e) => setDeliveryCharges(e.target.value)}
                      placeholder="0.00"
                    />
                  </TextField>
                  <DataFieldHorizontal
                    icon={<FeatherDollarSign />}
                    label={t('casePage.treatmentPlan.totalCost')}
                  >
                    <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                      ${totalCost.toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                </>
              ) : (
                <>
                  <DataFieldHorizontal
                    icon={<FeatherFileText />}
                    label={t('casePage.treatmentPlan.caseStudyFee')}
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      ${parseFloat(caseStudyFee || 0).toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label={t('casePage.treatmentPlan.alignersPrice')}
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      ${parseFloat(alignersPrice || 0).toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherTruck />}
                    label={t('casePage.treatmentPlan.deliveryCharges')}
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      ${parseFloat(deliveryCharges || 0).toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherDollarSign />}
                    label={t('casePage.treatmentPlan.totalCost')}
                  >
                    <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                      ${totalCost.toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                </>
              )}
            </div>
          </div>
          {/* View Viewer Button */}
          {caseHasViewer && (
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
              <Button
                onClick={handleViewerClick}
                icon={<FeatherEye />}
                className="flex-shrink-0 w-auto"
              >
                {t('adminTreatmentPlan.openViewer')}
              </Button>
              <div className="flex w-full gap-2">
                <TextField className="flex flex-grow">
                  <TextField.Input
                    type="text"
                    value={viewerLink || ''}
                    readOnly
                  />
                </TextField>
                <IconButton
                  icon={<FeatherCopy />}
                  onClick={handleCopyLink}
                  aria-label={
                    copySuccess
                      ? t('adminTreatmentPlan.copied')
                      : t('adminTreatmentPlan.copyLink')
                  }
                  variant={copySuccess ? 'brand-primary' : 'neutral-secondary'}
                  className="flex-shrink-0"
                />
              </div>
            </div>
          )}

          <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-border" />

          <div className="flex w-full items-center justify-between">
            {!isMobile && (
              <span className="text-body font-body text-subtext-color">
                {isEditingPlan &&
                ![
                  'approved',
                  'in_production',
                  'ready_for_delivery',
                  'delivered',
                  'completed',
                  'user_rejected',
                ].includes(currentStatus)
                  ? t('adminTreatmentPlan.statusMessages.editing')
                  : currentStatus === 'awaiting_user_approval'
                  ? t('adminTreatmentPlan.statusMessages.awaitingApproval')
                  : currentStatus === 'approved'
                  ? t('adminTreatmentPlan.statusMessages.approved')
                  : currentStatus === 'rejected'
                  ? t('adminTreatmentPlan.statusMessages.rejected')
                  : currentStatus === 'in_production'
                  ? t('adminTreatmentPlan.statusMessages.inProduction')
                  : currentStatus === 'ready_for_delivery'
                  ? t('adminTreatmentPlan.statusMessages.readyForDelivery')
                  : currentStatus === 'delivered'
                  ? t('adminTreatmentPlan.statusMessages.delivered')
                  : currentStatus === 'user_rejected'
                  ? t('adminTreatmentPlan.statusMessages.userRejected')
                  : ''}
              </span>
            )}

            <div className="flex items-center gap-2">
              {isEditingPlan &&
              ![
                'approved',
                'in_production',
                'ready_for_delivery',
                'delivered',
                'completed',
                'user_rejected',
              ].includes(currentStatus) ? (
                <>
                  <Button
                    variant="destructive-secondary"
                    disabled={isDisabled}
                    onClick={handleDecline}
                  >
                    {t('adminTreatmentPlan.declineCase')}
                  </Button>
                  <Button
                    icon={<FeatherCheck />}
                    disabled={isDisabled}
                    onClick={handleSendForApproval}
                  >
                    {t('adminTreatmentPlan.sendForApproval')}
                  </Button>
                </>
              ) : currentStatus !== 'rejected' &&
                ['accepted', 'submitted', 'awaiting_user_approval'].includes(
                  currentStatus
                ) ? (
                <IconButton
                  icon={<FeatherEdit2 />}
                  onClick={handleStartEdit}
                  aria-label={t('adminTreatmentPlan.editPlan')}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <TreatmentPlanImagesUpload
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        caseId={caseData.id}
      />

      {/* IPR Chart Dialog (for editing) */}
      <IPRChartDialog
        isOpen={isIPRDialogOpen}
        onClose={() => setIsIPRDialogOpen(false)}
        onSave={handleIPRSave}
        initialData={iprData}
        caseId={caseData.id}
      />

      {/* IPR Chart Viewer (for viewing) */}
      <IPRChartViewer
        isOpen={isIPRViewerOpen}
        onClose={() => setIsIPRViewerOpen(false)}
        toothStatus={caseData.tooth_status || {}}
        iprData={iprData}
      />

      {/* Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <Dialog.Content className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-1 py-3 w-full">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('adminTreatmentPlan.printDialogTitle')}
            </span>

            <Button
              variant="brand-primary"
              icon={<FeatherPrinter />}
              onClick={() => {
                handlePrint();
                setIsPrintDialogOpen(false);
              }}
              className="w-auto"
            >
              {t('adminTreatmentPlan.printButton')}
            </Button>
          </div>

          <div className="border border-neutral-border rounded-lg bg-white">
            {/* Print Content */}
            <PrintableTreatmentPlan
              ref={printRef}
              caseData={caseData}
              upperJawAligners={upperJawAligners}
              lowerJawAligners={lowerJawAligners}
              estimatedDurationMonths={estimatedDurationMonths}
              iprData={iprData}
            />
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
};
export default AdminTreatmentPlanEditor;
