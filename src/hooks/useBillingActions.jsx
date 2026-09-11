import { useState, useCallback } from 'react';
import PaymentCollectionDialog from '../ui/components/billing/PaymentCollectionDialog';
import ExpensesDialog from '../ui/components/billing/ExpensesDialog';
import AdditionalServicesDialog from '../ui/components/billing/AdditionalServicesDialog';
import CreditDialog from '../ui/components/billing/CreditDialog';
import WithdrawalDialog from '../ui/components/billing/WithdrawalDialog';

export function useBillingActions({
  doctors = [],
  refetchBillingData,
  onSuccess,
  includeSuperAdminActions = true,
} = {}) {
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showExpensesDialog, setShowExpensesDialog] = useState(false);
  const [showCreditDialog, setShowCreditDialog] = useState(false);
  const [showWithdrawalDialog, setShowWithdrawalDialog] = useState(false);
  const [showAdditionalServicesDialog, setShowAdditionalServicesDialog] =
    useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const refresh = useCallback(() => {
    refetchBillingData?.();
    onSuccess?.();
  }, [refetchBillingData, onSuccess]);

  const openPaymentForDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setShowPaymentDialog(true);
  };

  const handleReceivePayment = () => {
    setSelectedDoctor(null);
    setShowPaymentDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setShowPaymentDialog(false);
    setSelectedDoctor(null);
  };

  const buttonProps = {
    onReceivePayment: handleReceivePayment,
    onMakePayment: includeSuperAdminActions
      ? () => setShowExpensesDialog(true)
      : null,
    onAddCredit: includeSuperAdminActions
      ? () => setShowCreditDialog(true)
      : null,
    onWithdrawProfits: includeSuperAdminActions
      ? () => setShowWithdrawalDialog(true)
      : null,
    onAddAdditionalService: includeSuperAdminActions
      ? () => setShowAdditionalServicesDialog(true)
      : null,
  };

  const dialogs = (
    <>
      <PaymentCollectionDialog
        isOpen={showPaymentDialog}
        onClose={handleClosePaymentDialog}
        doctors={doctors}
        initialDoctor={selectedDoctor}
        refetchBillingData={refresh}
      />

      {includeSuperAdminActions && (
        <>
          <ExpensesDialog
            isOpen={showExpensesDialog}
            onClose={() => setShowExpensesDialog(false)}
            refetchBillingData={refresh}
          />
          <CreditDialog
            isOpen={showCreditDialog}
            onClose={() => setShowCreditDialog(false)}
            refetchBillingData={refresh}
          />
          <WithdrawalDialog
            isOpen={showWithdrawalDialog}
            onClose={() => setShowWithdrawalDialog(false)}
            refetchBillingData={refresh}
          />
          <AdditionalServicesDialog
            isOpen={showAdditionalServicesDialog}
            onClose={() => setShowAdditionalServicesDialog(false)}
            doctors={doctors}
            refetchBillingData={refresh}
          />
        </>
      )}
    </>
  );

  return { buttonProps, dialogs, openPaymentForDoctor };
}
