import React from 'react';
import { Button } from '../Button';
import { TextField } from '../TextField';
import { Alert } from '../Alert';
import { FeatherCheck, FeatherX, FeatherDollarSign } from '@subframe/core';

const CaseAcceptanceCard = ({
  currentStatus,
  caseStudyFee,
  setCaseStudyFee,
  saving,
  acceptCase,
  handleDecline,
}) => {
  // Only show this card for submitted cases
  if (currentStatus !== 'submitted') return null;

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-center gap-2">
        <FeatherCheck className="h-5 w-5 text-brand-600" />
        <span className="text-heading-3 font-heading-3 text-default-font">
          Case Review
        </span>
      </div>

      <Alert
        variant="brand"
        title="Review and Accept/Decline Case"
        description="Review the submitted case and decide whether to accept or decline it. If accepted, you can proceed to create the treatment plan."
      />

      <div className="flex w-full flex-col items-start gap-4">
        <div className="w-full max-w-xs">
          <TextField label="Case Study Fee">
            <TextField.Input
              type="number"
              min={0}
              step="0.01"
              value={caseStudyFee}
              onChange={(e) => setCaseStudyFee(e.target.value)}
              placeholder="0.00"
            />
          </TextField>
        </div>

        <div className="flex w-full items-center justify-between">
          <span className="text-body font-body text-subtext-color">
            Review the case details and decide whether to accept or decline this
            case.
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive-secondary"
              disabled={saving}
              onClick={handleDecline}
              icon={<FeatherX />}
            >
              Decline Case
            </Button>
            <Button
              disabled={saving}
              onClick={acceptCase}
              icon={<FeatherCheck />}
            >
              Accept Case
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseAcceptanceCard;
