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
  // Show this card for submitted cases (for acceptance) and accepted cases (for display only)
  if (currentStatus !== 'submitted' && currentStatus !== 'accepted')
    return null;

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <div className="flex w-full items-center gap-2">
        <FeatherCheck className="h-5 w-5 text-brand-600" />
        <span className="text-heading-3 font-heading-3 text-default-font">
          {currentStatus === 'submitted' ? 'Case Review' : 'Case Study Fee'}
        </span>
      </div>

      {currentStatus === 'submitted' ? (
        <>
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
                Review the case details and decide whether to accept or decline
                this case.
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
        </>
      ) : (
        <>
          <Alert
            variant="success"
            title="Case Accepted"
            description="This case has been accepted. The case study fee has been set and the case is ready for treatment planning."
          />

          <div className="flex w-full flex-col items-start gap-4">
            <div className="w-full max-w-xs">
              <TextField label="Case Study Fee" disabled>
                <TextField.Input
                  type="number"
                  value={caseStudyFee}
                  placeholder="0.00"
                  disabled
                />
              </TextField>
            </div>

            <div className="flex w-full items-center justify-between">
              <span className="text-body font-body text-subtext-color">
                Case study fee has been set. You can now proceed to create the
                treatment plan.
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CaseAcceptanceCard;
