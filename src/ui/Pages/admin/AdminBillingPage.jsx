import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { TextField } from '../../components/TextField';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';
import { FeatherLogs, FeatherSearch } from '@subframe/core';

import DoctorsBillingTable from '../../components/billing/DoctorsBillingTable';
import BillingStats from '../../components/billing/BillingStats';
import { useBillingData } from '../../../hooks/useBillingData';
import AdminHeadline from '../../components/AdminHeadline';
import { Link } from 'react-router';
import { isSuperAdmin } from '../../../helper/auth';
import { useUserRole } from '../../../helper/useUserRole';
import { useBillingActions } from '../../../hooks/useBillingActions';

function AdminBillingPage() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');

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

  const { buttonProps, dialogs, openPaymentForDoctor } = useBillingActions({
    doctors,
    refetchBillingData,
    includeSuperAdminActions: isSuperAdminUser,
  });

  const filteredDoctors = doctors.filter((doctor) => {
    const q = searchTerm.toLowerCase();
    const name = doctor.full_name?.toLowerCase() || '';
    const clinic = doctor.clinic?.toLowerCase() || '';
    return name.includes(q) || clinic.includes(q);
  });

  return (
    <>
      {error && <Error error={error} />}

      <AdminHeadline submit={false}>{t('billing.title')}</AdminHeadline>

      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-body font-body text-subtext-color">
          {t('billing.subtitle')}
        </p>

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
            {...buttonProps}
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
            onCollectPayment={openPaymentForDoctor}
          />
        </>
      )}

      {dialogs}
    </>
  );
}

export default AdminBillingPage;
