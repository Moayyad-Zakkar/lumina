import React, { useState } from 'react';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { DataFieldHorizontal } from '../DataFieldHorizontal';
import { Badge } from '../Badge';
import { IconButton } from '../IconButton';
import {
  FeatherGrid,
  FeatherClock,
  FeatherDollarSign,
  FeatherFileText,
  FeatherTruck,
  FeatherEdit2,
  FeatherX,
  FeatherCheck,
  FeatherImage,
  FeatherEye,
  FeatherCopy,
} from '@subframe/core';
import TreatmentPlanImagesUpload from './TreatmentPlanImagesUpload';

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
}) => {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(viewerLink);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

  return (
    <>
      <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
        <div className="flex w-full items-center justify-between">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Treatment Plan Review
          </span>
          {/* Upload Images Button 
          <Button
            variant="neutral-secondary"
            icon={<FeatherImage />}
            onClick={() => setIsUploadDialogOpen(true)}
            size="small"
          >
            Treatment Images
          </Button>
          */}
        </div>

        <div className="flex w-full flex-col items-start gap-6">
          <div className="flex w-full flex-wrap items-start gap-6">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
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
                    Aligner Material:
                    <Badge>
                      {caseData.aligner_material} ({alignerUnitPrice}$)
                    </Badge>
                  </div>

                  <TextField label="Upper Jaw Aligners">
                    <TextField.Input
                      type="number"
                      min={1}
                      value={upperJawAligners}
                      onChange={(e) => setUpperJawAligners(e.target.value)}
                    />
                  </TextField>
                  <TextField label="Lower Jaw Aligners">
                    <TextField.Input
                      type="number"
                      min={1}
                      value={lowerJawAligners}
                      onChange={(e) => setLowerJawAligners(e.target.value)}
                    />
                  </TextField>
                  <TextField label="Estimated Duration (months)">
                    <TextField.Input
                      type="number"
                      min={1}
                      value={estimatedDurationMonths}
                      onChange={(e) =>
                        setEstimatedDurationMonths(e.target.value)
                      }
                    />
                  </TextField>
                  {/* Upload Images Button */}
                  <Button
                    variant="neutral-secondary"
                    icon={<FeatherImage />}
                    onClick={() => setIsUploadDialogOpen(true)}
                    size="small"
                  >
                    Add Treatment Plan Viewer
                  </Button>
                </>
              ) : (
                <>
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label="Upper Jaw Aligners"
                  >
                    <Badge>{upperJawAligners || '—'} Aligners</Badge>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label="Lower Jaw Aligners"
                  >
                    <Badge>{lowerJawAligners || '—'} Aligners</Badge>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherClock />}
                    label="Estimated Duration"
                  >
                    <span className="whitespace-nowrap text-body font-body text-default-font">
                      {estimatedDurationMonths || '—'} Months
                    </span>
                  </DataFieldHorizontal>
                </>
              )}
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
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
                  <TextField label="Case Study Fee" disabled>
                    <TextField.Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={caseStudyFee}
                      placeholder="0.00"
                      disabled
                    />
                  </TextField>
                  <TextField label="Aligners Price">
                    <TextField.Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={alignersPrice}
                      onChange={(e) => setAlignersPrice(e.target.value)}
                      placeholder="0.00"
                    />
                  </TextField>
                  <TextField label="Delivery Charges">
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
                    label="Total Cost"
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
                    label="Case Study Fee"
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      ${parseFloat(caseStudyFee || 0).toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherGrid />}
                    label="Aligners Price"
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      ${parseFloat(alignersPrice || 0).toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherTruck />}
                    label="Delivery Charges"
                  >
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                      ${parseFloat(deliveryCharges || 0).toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                  <DataFieldHorizontal
                    icon={<FeatherDollarSign />}
                    label="Total Cost"
                  >
                    <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                      ${totalCost.toFixed(2)}
                    </span>
                  </DataFieldHorizontal>
                </>
              )}
            </div>

            {/* View 3DA Viewer Button */}
            {caseHasViewer && (
              <div className="flex w-full items-center gap-2">
                <Button
                  onClick={handleViewerClick}
                  icon={<FeatherEye />}
                  className="flex-shrink-0 w-auto"
                >
                  Open 3DA Viewer
                </Button>

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
                  aria-label={copySuccess ? 'Copied!' : 'Copy link'}
                  variant={copySuccess ? 'brand-primary' : 'neutral-secondary'}
                  className="flex-shrink-0 "
                />
              </div>
            )}
          </div>

          <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-border" />

          <div className="flex w-full items-center justify-between">
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
                ? 'Choose to decline the case or set plan details and send to the doctor for approval.'
                : currentStatus === 'awaiting_user_approval'
                ? 'Plan details are awaiting doctor approval.'
                : currentStatus === 'approved'
                ? 'Plan approved by doctor. Proceed with manufacturing.'
                : currentStatus === 'rejected'
                ? 'Case has been declined and is inactive.'
                : currentStatus === 'in_production'
                ? 'Manufacturing in progress.'
                : currentStatus === 'ready_for_delivery'
                ? 'Ready for delivery to patient.'
                : currentStatus === 'delivered'
                ? 'Delivered to patient. Mark completed when treatment ends.'
                : currentStatus === 'user_rejected'
                ? 'Case treatment plan has been declined by the doctor and is inactive.'
                : ''}
            </span>
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
                    variant="neutral-tertiary"
                    onClick={handleCancelEdit}
                    icon={<FeatherX />}
                  >
                    Cancel editing
                  </Button>
                  <Button
                    variant="destructive-secondary"
                    disabled={isDisabled}
                    onClick={handleDecline}
                  >
                    Decline Case
                  </Button>
                  <Button
                    icon={<FeatherCheck />}
                    disabled={isDisabled}
                    onClick={handleSendForApproval}
                  >
                    Send for Doctor Approval
                  </Button>
                </>
              ) : currentStatus !== 'rejected' &&
                ['accepted', 'submitted', 'awaiting_user_approval'].includes(
                  currentStatus
                ) ? (
                <IconButton
                  icon={<FeatherEdit2 />}
                  onClick={handleStartEdit}
                  aria-label="Edit plan details"
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
    </>
  );
};

export default AdminTreatmentPlanEditor;
