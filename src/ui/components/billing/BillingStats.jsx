import React from 'react';
import { useTranslation } from 'react-i18next';
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
        {totalEarnings !== null && totalEarnings !== undefined && (
          <EarningsCard totalEarnings={totalEarnings} />
        )}
        {totalDue !== null && totalDue !== undefined && (
          <DuePaymentsCard totalDue={totalDue} />
        )}

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

const EarningsCard = ({ totalEarnings }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('billingStats.netIncome')}
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
            {t('billingStats.allTime')}
          </span>
        </div>
      </div>
    </div>
  );
};

const DuePaymentsCard = ({ totalDue }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('billingStats.duePayments')}
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
            {t('billingStats.outstanding')}
          </span>
        </div>
      </div>
    </div>
  );
};

const ExpensesCard = ({ totalExpenses }) => {
  const { t } = useTranslation();

  return (
    <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
      <div className="flex w-full flex-col items-start gap-2">
        <span className="text-body font-body text-subtext-color">
          {t('billingStats.totalExpenses')}
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
            {t('billingStats.allTime')}
          </span>
        </div>
      </div>
    </div>
  );
};

const PaymentButton = ({ onReceivePayment }) => {
  const { t } = useTranslation();

  return (
    <Button
      className="h-10 w-auto flex-none"
      icon={<FeatherArrowDown />}
      onClick={onReceivePayment}
      variant="success-primary"
    >
      {t('billingStats.receivePayment')}
    </Button>
  );
};

const ExpenseButton = ({ onMakePayment }) => {
  const { t } = useTranslation();

  return (
    <Button
      className="h-10 w-auto flex-none"
      variant="destructive-primary"
      icon={<FeatherTrendingDown />}
      onClick={onMakePayment}
    >
      {t('billingStats.recordExpense')}
    </Button>
  );
};

export default BillingStats;
