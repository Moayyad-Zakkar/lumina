import React, { useState } from 'react';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import { FeatherLogs, FeatherSearch } from '@subframe/core';

import DoctorCasesTable from '../components/billing/DoctorCasesTable';
import DoctorBillingStats from '../components/billing/DoctorBillingStats';
//import TransactionLogDialog from '../../components/billing/TransactionLogDialog';
import { useDoctorBillingData } from '../../hooks/useDoctorBillingData';
import Headline from '../components/Headline';

function DoctorBillingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showTransactionLog, setShowTransactionLog] = useState(false);

  const {
    cases,
    loading,
    error,
    totalCases,
    totalDue,
    totalPaid,
    pendingCases,
    completedCases,
    refetchBillingData,
  } = useDoctorBillingData();

  // Filter cases based on search term
  const filteredCases = cases.filter(
    (case_item) =>
      case_item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_item.case_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_item.treatment_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleShowTransactionLog = () => {
    setShowTransactionLog(true);
  };

  const handleCloseTransactionLog = () => {
    setShowTransactionLog(false);
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
        <PageHeader onShowTransactionLog={handleShowTransactionLog} />
        <DoctorBillingStats
          totalCases={totalCases}
          totalDue={totalDue}
          totalPaid={totalPaid}
          pendingCases={pendingCases}
          completedCases={completedCases}
        />
      </div>

      <div className="flex w-full flex-col items-start gap-6">
        <CasesSection
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filteredCases={filteredCases}
        />
      </div>

      {/*<TransactionLogDialog
        isOpen={showTransactionLog}
        onClose={handleCloseTransactionLog}
        refetchBillingData={refetchBillingData}
      />*/}
    </>
  );
}

const PageHeader = ({ onShowTransactionLog }) => (
  <div className="flex w-full flex-wrap items-center justify-between gap-2">
    <div className="w-auto">
      <Headline submit={false}>My Billing</Headline>
    </div>

    <Button
      variant="neutral-secondary"
      icon={<FeatherLogs />}
      className="w-auto"
      onClick={onShowTransactionLog}
    >
      Transaction Log
    </Button>
  </div>
);

const CasesSection = ({ searchTerm, onSearchChange, filteredCases }) => (
  <>
    <CasesSectionHeader
      searchTerm={searchTerm}
      onSearchChange={onSearchChange}
    />
    <DoctorCasesTable cases={filteredCases} />
  </>
);

const CasesSectionHeader = ({ searchTerm, onSearchChange }) => (
  <div className="flex w-full items-center gap-2">
    <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
      My Cases & Billing
    </span>
    <TextField variant="filled" label="" helpText="" icon={<FeatherSearch />}>
      <TextField.Input
        placeholder="Search cases..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </TextField>
  </div>
);

export default DoctorBillingPage;
