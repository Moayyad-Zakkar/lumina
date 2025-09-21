import React from 'react';
import { Button } from '../Button';
import {
  FeatherArrowDown,
  FeatherArrowUp,
  FeatherTrendingDown,
} from '@subframe/core';

const BillingStats = ({
  totalEarnings,
  totalDue,
  totalExpenses,
  onReceivePayment,
  onMakePayment,
}) => {
  return (
    <div className="flex w-full flex-wrap items-start gap-4">
      <EarningsCard
        totalEarnings={totalEarnings}
        onReceivePayment={onReceivePayment}
      />
      <DuePaymentsCard totalDue={totalDue} onMakePayment={onMakePayment} />
      <ExpensesCard
        totalExpenses={totalExpenses}
        onMakePayment={onMakePayment}
      />
    </div>
  );
};

const EarningsCard = ({ totalEarnings, onReceivePayment }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">
        Total Earnings
      </span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-success-600">
          $
          {totalEarnings.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          all time
        </span>
      </div>
    </div>
    <Button
      className="h-10 w-full flex-none"
      icon={<FeatherArrowDown />}
      onClick={onReceivePayment}
    >
      Receive Payment
    </Button>
  </div>
);

const DuePaymentsCard = ({ totalDue, onMakePayment }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">
        Due Payments
      </span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-error-600">
          $
          {totalDue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          outstanding
        </span>
      </div>
    </div>
    <div className="h-10 w-full flex-none"></div>
    {/*<Button
      
      variant="destructive-primary"
      icon={<FeatherArrowUp />}
      onClick={onMakePayment}
    >
      Make Payment
    </Button>*/}
  </div>
);

const ExpensesCard = ({ totalExpenses, onMakePayment }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">
        Total Expenses
      </span>
      <div className="flex items-end gap-2">
        <span className="text-heading-1 font-heading-1 text-warning-600">
          $
          {totalExpenses.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-body font-body text-subtext-color pb-1">
          all time
        </span>
      </div>
    </div>
    <Button
      className="h-10 w-full flex-none"
      variant="destructive-primary"
      icon={<FeatherTrendingDown />}
      onClick={onMakePayment}
    >
      Record Expense
    </Button>
  </div>
);

export default BillingStats;
