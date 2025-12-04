import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../Button';
import {
  FeatherFileText,
  FeatherClock,
  FeatherCheckCircle,
} from '@subframe/core';
import { Loader } from '../Loader';

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

const TotalCasesCard = ({ totalCases }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('dashboard.totalCases')}
        </span>
        <div className="flex items-end gap-2">
          <span className="text-heading-1 font-heading-1 text-brand-700">
            {totalCases === null ? <Loader size="small" /> : totalCases}
          </span>
          <span className="text-body font-body text-subtext-color pb-1">
            {t('billingStats.allTime')}
          </span>
        </div>
      </div>
    </div>
  );
};

const DuePaymentCard = ({ totalDue }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('doctorBillingStats.amountDue')}
        </span>
        <div className="flex items-end gap-2">
          <span className="text-heading-1 font-heading-1 text-error-600">
            $
            {totalDue?.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-body font-body text-subtext-color pb-1">
            {t('billingStats.outstanding')}
          </span>
        </div>
      </div>
    </div>
  );
};

const SubmittedCasesCard = ({ submittedCases }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('dashboard.pendingReview')}
        </span>
        <div className="flex items-end gap-2">
          <span className="text-heading-1 font-heading-1 text-error-600">
            {submittedCases}
          </span>
          <span className="text-body font-body text-subtext-color pb-1">
            {t('doctorBillingStats.cases')}
          </span>
        </div>
      </div>
    </div>
  );
};

const TotalPaidCard = ({ totalPaid }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('doctorBillingStats.totalPaid')}
        </span>
        <div className="flex items-end gap-2">
          <span className="text-heading-1 font-heading-1 text-success-600">
            $
            {totalPaid?.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
          <span className="text-body font-body text-subtext-color pb-1">
            {t('billingStats.allTime')}
          </span>
        </div>
      </div>
    </div>
  );
};

const PendingCasesCard = ({ pendingCases }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('doctorBillingStats.pendingCases')}
        </span>
        <div className="flex items-end gap-2">
          <span className="text-heading-1 font-heading-1 text-warning-600">
            {pendingCases.toLocaleString('en-US')}
          </span>
          <span className="text-body font-body text-subtext-color pb-1">
            {t('doctorBillingStats.inProgress')}
          </span>
        </div>
      </div>
    </div>
  );
};

const CompletedCasesCard = ({ completedCases }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('dashboard.completedBy3DA')}
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
            {t('doctorBillingStats.finished')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DoctorBillingStats;
