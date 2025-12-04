import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';
import { FeatherLogs, FeatherSearch } from '@subframe/core';

import DoctorsBillingTable from '../../components/billing/DoctorsBillingTable';
import PaymentCollectionDialog from '../../components/billing/PaymentCollectionDialog';
import ExpensesDialog from '../../components/billing/ExpensesDialog';
import BillingStats from '../../components/billing/BillingStats';
import { useBillingData } from '../../../hooks/useBillingData';
import AdminHeadline from '../../components/AdminHeadline';
import { Link } from 'react-router';
import { isSuperAdmin } from '../../../helper/auth';
import { useUserRole } from '../../../helper/useUserRole';

function AdminBillingPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showExpensesDialog, setShowExpensesDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const { role } = useUserRole();
  const isSuperAdminUser = isSuperAdmin(role);

  const {
    doctors,
    loading,
    error,
    totalEarnings,
    totalDue,
    totalExpenses,
    refetchBillingData,
  } = useBillingData();

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.clinic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCollectPayment = (doctor) => {
    setSelectedDoctor(doctor);
    setShowPaymentDialog(true);
  };

  const handleReceivePayment = () => {
    setSelectedDoctor(null);
    setShowPaymentDialog(true);
  };

  const handleMakePayment = () => {
    setShowExpensesDialog(true);
  };

  const handleClosePaymentDialog = () => {
    setShowPaymentDialog(false);
    setSelectedDoctor(null);
  };

  const handleCloseExpensesDialog = () => {
    setShowExpensesDialog(false);
  };

  return (
    <>
      {error && <Error error={error} />}

      <AdminHeadline submit={false}>{t('billing.title')}</AdminHeadline>

      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-body font-body text-subtext-color">
          {t('billing.subtitle')}
        </p>

        {/* Only super admin can see transaction log */}
        {isSuperAdminUser && (
          <Link to="/admin/billing/log">
            <Button
              variant="neutral-secondary"
              icon={<FeatherLogs />}
              className="w-auto"
            >
              {t('billing.transactionLog')}
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex w-full h-full min-h-[200px] justify-center items-center">
          <Loader size="medium" />
        </div>
      ) : (
        <>
          <BillingStats
            totalEarnings={isSuperAdminUser ? totalEarnings : null}
            totalDue={isSuperAdminUser ? totalDue : null}
            totalExpenses={isSuperAdminUser ? totalExpenses : null}
            onReceivePayment={handleReceivePayment}
            onMakePayment={isSuperAdminUser ? handleMakePayment : null}
          />

          <div className="flex w-full items-center gap-2">
            <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
              {t('billing.doctorsBilling')}
            </span>
            <div className="flex-shrink-0 max-w-[300px] min-w-[200px]">
              <TextField
                variant="filled"
                label=""
                helpText=""
                icon={<FeatherSearch />}
              >
                <TextField.Input
                  placeholder={t('billing.searchDoctors')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </TextField>
            </div>
          </div>

          <DoctorsBillingTable
            doctors={filteredDoctors}
            onCollectPayment={handleCollectPayment}
          />
        </>
      )}

      <PaymentCollectionDialog
        isOpen={showPaymentDialog}
        onClose={handleClosePaymentDialog}
        doctors={doctors}
        initialDoctor={selectedDoctor}
        refetchBillingData={refetchBillingData}
      />

      {/* Only render expenses dialog for super admin */}
      {isSuperAdminUser && (
        <ExpensesDialog
          isOpen={showExpensesDialog}
          onClose={handleCloseExpensesDialog}
          refetchBillingData={refetchBillingData}
        />
      )}
    </>
  );
}

export default AdminBillingPage;
