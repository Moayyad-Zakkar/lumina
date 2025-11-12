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
  withButtons = true,
}) => {
  return (
    <>
      <div className="flex w-full flex-wrap items-start gap-4">
        <EarningsCard totalEarnings={totalEarnings} />
        <DuePaymentsCard totalDue={totalDue} />

        {totalExpenses !== null && totalExpenses !== undefined && (
          <ExpensesCard totalExpenses={totalExpenses} />
        )}
      </div>
      {withButtons && (
        <div className="flex w-full flex-wrap items-start gap-4">
          <PaymentButton onReceivePayment={onReceivePayment} />
          {onMakePayment && <ExpenseButton onMakePayment={onMakePayment} />}
        </div>
      )}
    </>
  );
};

const EarningsCard = ({ totalEarnings }) => (
  <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
    <div className="flex w-full flex-col items-start gap-2">
      <span className="text-body font-body text-subtext-color">Net Income</span>
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
  </div>
);

const DuePaymentsCard = ({ totalDue }) => (
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
    {/*
    <div className="h-10 w-full flex-none"></div>
    <Button
    
      
      variant="destructive-primary"
      icon={<FeatherArrowUp />}
      onClick={onMakePayment}
    >
      Make Payment
    </Button>*/}
  </div>
);

const ExpensesCard = ({ totalExpenses }) => (
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
  </div>
);

const PaymentButton = ({ onReceivePayment }) => {
  return (
    <Button
      className="h-10 w-auto flex-none"
      icon={<FeatherArrowDown />}
      onClick={onReceivePayment}
    >
      Receive Payment
    </Button>
  );
};

const ExpenseButton = ({ onMakePayment }) => {
  return (
    <Button
      className="h-10 w-auto flex-none"
      variant="destructive-primary"
      icon={<FeatherTrendingDown />}
      onClick={onMakePayment}
    >
      Record Expense
    </Button>
  );
};

export default BillingStats;
