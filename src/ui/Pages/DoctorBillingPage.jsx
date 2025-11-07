import React, { useState } from 'react';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { Loader } from '../components/Loader';
import Error from '../components/Error';
import { FeatherLogs, FeatherSearch } from '@subframe/core';

import DoctorCasesTable from '../components/billing/DoctorCasesTable';
import DoctorBillingStats from '../components/billing/DoctorBillingStats';
import { useDoctorBillingData } from '../../hooks/useDoctorBillingData';
import Headline from '../components/Headline';
import { Link } from 'react-router';

function DoctorBillingPage() {
  const [searchTerm, setSearchTerm] = useState('');

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

  return (
    <>
      {error && <Error error={error} />}

      <Headline submit={false}>My Billing</Headline>

      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-body font-body text-subtext-color">
          View your cases and track billing information
        </p>

        <Link to="/app/billing/log">
          <Button
            variant="neutral-secondary"
            icon={<FeatherLogs />}
            className="w-auto"
          >
            Payments History
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex w-full h-full min-h-[200px] justify-center items-center">
          <Loader size="medium" />
        </div>
      ) : (
        <>
          <DoctorBillingStats
            totalCases={totalCases}
            totalDue={totalDue}
            totalPaid={totalPaid}
            pendingCases={pendingCases}
            completedCases={completedCases}
          />

          <div className="flex w-full items-center gap-2">
            <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
              My Cases & Billing
            </span>
            <div className="flex-shrink-0 max-w-[300px] min-w-[200px]">
              <TextField
                variant="filled"
                label=""
                helpText=""
                icon={<FeatherSearch />}
              >
                <TextField.Input
                  placeholder="Search cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </TextField>
            </div>
          </div>

          <DoctorCasesTable cases={filteredCases} />
        </>
      )}
    </>
  );
}

export default DoctorBillingPage;
