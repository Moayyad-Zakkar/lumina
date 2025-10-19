import React from 'react';
import { Button } from '../Button';
import {
  FeatherFileText,
  FeatherClock,
  FeatherCheckCircle,
} from '@subframe/core';

const DoctorBillingStats = ({
  totalCases,
  totalDue,
  totalPaid,
  isDashboard = false,
  pendingCases,
  completedCases,
  submittedCases,
  withButtons = false,
}) => {
  return (
    <>
      <div className="flex w-full flex-wrap items-start gap-4">
        {isDashboard === true ? (
          <SubmittedCasesCard submittedCases={submittedCases} />
        ) : null}
        <TotalCasesCard totalCases={totalCases} />
        <CompletedCasesCard completedCases={completedCases} />
        <DuePaymentCard totalDue={totalDue} />
      </div>

      {/*<div className="flex w-full flex-wrap items-start gap-4">
        <TotalPaidCard totalPaid={totalPaid} />
        <PendingCasesCard pendingCases={pendingCases} />
        
      </div>*/}
    </>
  );
};

const TotalCasesCard = ({ totalCases }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">
        Total Cases
      </span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-brand-700">
          {totalCases === null ? <Loader size="small" /> : totalCases}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          all time
        </span>
      </div>
    </div>
  </div>
);

const DuePaymentCard = ({ totalDue }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">Amount Due</span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-error-600">
          $
          {totalDue?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          outstanding
        </span>
      </div>
    </div>
  </div>
);

const SubmittedCasesCard = ({ submittedCases }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">
        Pending Review
      </span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-error-600">
          {submittedCases}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          cases
        </span>
      </div>
    </div>
  </div>
);

const TotalPaidCard = ({ totalPaid }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">Total Paid</span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-success-600">
          $
          {totalPaid?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          all time
        </span>
      </div>
    </div>
  </div>
);

const PendingCasesCard = ({ pendingCases }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">
        Pending Cases
      </span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-warning-600">
          {pendingCases.toLocaleString('en-US')}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          in progress
        </span>
      </div>
    </div>
  </div>
);

const CompletedCasesCard = ({ completedCases }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">
        Completed Cases
      </span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-success-600">
          {completedCases === null ? (
            <Loader size="small" />
          ) : (
            completedCases?.toLocaleString('en-US')
          )}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          finished
        </span>
      </div>
    </div>
  </div>
);

export default DoctorBillingStats;
