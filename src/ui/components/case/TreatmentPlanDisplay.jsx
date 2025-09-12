import React from 'react';
import { DataFieldHorizontal } from '../DataFieldHorizontal';
import { Badge } from '../Badge';
import { FeatherGrid, FeatherClock, FeatherDollarSign, FeatherFileText, FeatherPlusCircle, FeatherCalculator } from '@subframe/core';

const TreatmentPlanDisplay = ({ caseData, showPlanSection }) => {
  if (!showPlanSection) return null;

  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        Treatment Plan Review
      </span>
      <div className="flex w-full flex-col items-start gap-6">
        <div className="flex w-full flex-wrap items-start gap-6">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
            <DataFieldHorizontal icon={<FeatherGrid />} label="Upper Jaw Aligners">
              <Badge>{caseData.upper_jaw_aligners ?? '—'} Aligners</Badge>
            </DataFieldHorizontal>
            <DataFieldHorizontal icon={<FeatherGrid />} label="Lower Jaw Aligners">
              <Badge>{caseData.lower_jaw_aligners ?? '—'} Aligners</Badge>
            </DataFieldHorizontal>
            <DataFieldHorizontal icon={<FeatherClock />} label="Estimated Duration">
              <span className="whitespace-nowrap text-body font-body text-default-font">
                {caseData.estimated_duration_months ?? '—'} Months
              </span>
            </DataFieldHorizontal>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
            <DataFieldHorizontal icon={<FeatherDollarSign />} label="Case Study Fee">
              <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                ${caseData.case_study_fee ? parseFloat(caseData.case_study_fee).toFixed(2) : '0'}
              </span>
            </DataFieldHorizontal>
            <DataFieldHorizontal icon={<FeatherGrid />} label="Aligners Price">
              <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                ${caseData.aligners_price ? parseFloat(caseData.aligners_price).toFixed(2) : '0'}
              </span>
            </DataFieldHorizontal>
            <DataFieldHorizontal icon={<FeatherPlusCircle />} label="Delivery Charges">
              <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                ${caseData.delivery_charges ? parseFloat(caseData.delivery_charges).toFixed(2) : '0'}
              </span>
            </DataFieldHorizontal>
            <DataFieldHorizontal icon={<FeatherCalculator />} label="Total Cost">
              <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                ${caseData.total_cost ? parseFloat(caseData.total_cost).toFixed(2) : '0'}
              </span>
            </DataFieldHorizontal>
          </div>
        </div>

        {/* Admin Note Section */}
        {caseData.admin_note && (
          <>
            <div className="flex w-full items-center justify-between">
              <span className="text-heading-3 font-heading-3 text-default-font">
                3DA Notes
              </span>
            </div>
            <div className="w-full">
              <div className="w-full bg-white border border-neutral-200 rounded-md p-4 shadow-sm">
                <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                  {caseData.admin_note}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TreatmentPlanDisplay;
