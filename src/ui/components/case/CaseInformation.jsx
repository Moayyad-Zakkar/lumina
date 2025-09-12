import React from 'react';
import { DataFieldHorizontal } from '../DataFieldHorizontal';
import { Badge } from '../Badge';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import {
  FeatherUser,
  FeatherCalendar,
  FeatherTag,
  FeatherHospital,
  FeatherBox,
  FeatherPhone,
  FeatherRefreshCw,
} from '@subframe/core';

const CaseInformation = ({ caseData, isAdmin = false }) => {
  return (
    <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        {isAdmin ? 'Case Information' : 'Patient Information'}
      </span>
      <div className="flex w-full flex-wrap items-start gap-6">
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
          <DataFieldHorizontal icon={<FeatherUser />} label="First Name">
            <span className="whitespace-nowrap text-body font-body text-default-font">
              {capitalizeFirstSafe(caseData.first_name) || 'N/A'}
            </span>
          </DataFieldHorizontal>
          <DataFieldHorizontal icon={<FeatherUser />} label="Last Name">
            <span className="whitespace-nowrap text-body font-body text-default-font">
              {capitalizeFirstSafe(caseData.last_name) || 'N/A'}
            </span>
          </DataFieldHorizontal>
          {isAdmin && (
            <DataFieldHorizontal icon={<FeatherUser />} label={"Doctor's Name"}>
              <span className="whitespace-nowrap text-body font-body text-default-font">
                {capitalizeFirstSafe(caseData.profiles?.full_name) || 'N/A'}
              </span>
            </DataFieldHorizontal>
          )}
          {isAdmin && (
            <DataFieldHorizontal icon={<FeatherPhone />} label="Phone">
              <span className="whitespace-nowrap text-body font-body text-default-font">
                {caseData.profiles?.phone || 'N/A'}
              </span>
            </DataFieldHorizontal>
          )}
          <DataFieldHorizontal
            icon={<FeatherCalendar />}
            label="Submission Date"
          >
            <span className="whitespace-nowrap text-body font-body text-default-font">
              {caseData.created_at
                ? new Date(caseData.created_at).toLocaleDateString()
                : 'N/A'}
            </span>
          </DataFieldHorizontal>
        </div>
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
          <DataFieldHorizontal icon={<FeatherTag />} label="Case ID">
            <span className="whitespace-nowrap text-body font-body text-default-font">
              CASE-{caseData.id}
            </span>
          </DataFieldHorizontal>
          {isAdmin && (
            <DataFieldHorizontal icon={<FeatherHospital />} label="Clinic">
              <span className="whitespace-nowrap text-body font-body text-default-font">
                {caseData.profiles?.clinic || 'N/A'}
              </span>
            </DataFieldHorizontal>
          )}
          <DataFieldHorizontal icon={<FeatherBox />} label="Aligner Material">
            <Badge>{caseData.aligner_material || 'Not specified'}</Badge>
          </DataFieldHorizontal>
          {caseData.refinement_reason && (
            <DataFieldHorizontal
              icon={<FeatherRefreshCw />}
              label="Refinement Reason"
            >
              <span className="text-body font-body text-default-font">
                {caseData.refinement_reason}
              </span>
            </DataFieldHorizontal>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseInformation;
