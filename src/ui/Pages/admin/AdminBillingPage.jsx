import React, { useState } from 'react';
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

function AdminBillingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showExpensesDialog, setShowExpensesDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

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

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return <Error error={error} />;
  }

  return (
    <>
      <div className="flex w-full flex-col items-start gap-6">
        <PageHeader />
        <BillingStats
          totalEarnings={totalEarnings}
          totalDue={totalDue}
          totalExpenses={totalExpenses}
          onReceivePayment={handleReceivePayment}
          onMakePayment={handleMakePayment}
        />
      </div>

      <div className="flex w-full flex-col items-start gap-6">
        <DoctorsSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredDoctors={filteredDoctors}
          onCollectPayment={handleCollectPayment}
        />
      </div>

      <PaymentCollectionDialog
        isOpen={showPaymentDialog}
        onClose={handleClosePaymentDialog}
        doctors={doctors}
        initialDoctor={selectedDoctor}
        refetchBillingData={refetchBillingData}
      />

      <ExpensesDialog
        isOpen={showExpensesDialog}
        onClose={handleCloseExpensesDialog}
        refetchBillingData={refetchBillingData}
      />
    </>
  );
}

const PageHeader = () => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div className="w-auto">
      <AdminHeadline submit={false}>Billing Management</AdminHeadline>
    </div>
    {/*
    <span className="grow shrink-0 basis-0 text-heading-2 font-heading-2 text-default-font">
      Billing Management
    </span>
    */}

    <Button
      variant="neutral-secondary"
      icon={<FeatherLogs />}
      className="w-auto"
    >
      Transaction Log
    </Button>
  </div>
);

const DoctorsSection = ({
  searchTerm,
  onSearchChange,
  filteredDoctors,
  onCollectPayment,
}) => (
  <>
    <DoctorsSectionHeader
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
    />
    <DoctorsBillingTable
      doctors={filteredDoctors}
      onCollectPayment={onCollectPayment}
    />
  </>
);

const DoctorsSectionHeader = ({ searchTerm, onSearchChange }) => (
  <div className="flex w-full items-center gap-2">
    <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
      Doctors Billing
    </span>
    <TextField variant="filled" label="" helpText="" icon={<FeatherSearch />}>
      <TextField.Input
        placeholder="Search doctors..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </TextField>
  </div>
);

export default AdminBillingPage;
