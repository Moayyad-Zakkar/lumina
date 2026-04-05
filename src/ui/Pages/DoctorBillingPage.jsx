import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { useIsMobile } from '../../hooks/useIsMobile';
import AdditionalServicesTable from '../components/billing/AdditionalServicesTable';
import supabase from '../../helper/supabaseClient';
import { useUser } from '../../helper/useUser';

function DoctorBillingPage() {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useUser();

  const {
    cases,
    loading,
    error,
    totalCases,
    totalDue,
    totalPaid,
    pendingCases,
    completedCases,
  } = useDoctorBillingData();

  // ── Additional services state ──────────────────────────────────────────────
  const [additionalServices, setAdditionalServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    const fetchServices = async () => {
      setServicesLoading(true);
      const { data, error: fetchError } = await supabase
        .from('additional_services')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false });

      if (!fetchError && data) setAdditionalServices(data);
      setServicesLoading(false);
    };

    fetchServices();
  }, [user?.id]);

  // ── Cases filtering ────────────────────────────────────────────────────────
  const billableCases = cases.filter(
    (case_item) => case_item.paymentStatus?.toLowerCase() !== 'not_applicable',
  );

  const filteredCases = billableCases.filter(
    (case_item) =>
      case_item.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_item.case_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      case_item.treatment_type
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {error && <Error error={error} />}

      <Headline submit={false}>{t('billing.myBilling')}</Headline>

      <div className="flex w-full items-center justify-between gap-4">
        <p className="text-body font-body text-subtext-color">
          {t('billing.userSubtitle')}
        </p>

        <Link to="/app/billing/log">
          <Button
            variant="neutral-secondary"
            icon={<FeatherLogs />}
            className="w-auto"
          >
            {t('navigation.paymentsHistory')}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex w-full h-full min-h-[200px] justify-center items-center">
          <Loader size="medium" />
        </div>
      ) : (
        <>
          {!isMobile && (
            <DoctorBillingStats
              totalCases={totalCases}
              totalDue={totalDue}
              totalPaid={totalPaid}
              pendingCases={pendingCases}
              completedCases={completedCases}
            />
          )}

          {/* ── Cases section ──────────────────────────────────────────────── */}
          <div className="flex w-full items-center gap-2">
            <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
              {t('billing.myCasesAndBilling')}
            </span>
            <div className="flex-shrink-0 max-w-[300px] min-w-[200px]">
              <TextField
                variant="filled"
                label=""
                helpText=""
                icon={<FeatherSearch />}
              >
                <TextField.Input
                  placeholder={t('cases.searchPatientOrID')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </TextField>
            </div>
          </div>

          <DoctorCasesTable cases={filteredCases} />

          {/* ── Additional Services section ────────────────────────────────── */}
          {(servicesLoading || additionalServices.length > 0) && (
            <div className="flex flex-col gap-4 w-full">
              <span className="text-heading-3 font-heading-3 text-default-font">
                {t('additionalServices.buttonLabel')}
              </span>

              {servicesLoading ? (
                <div className="flex w-full justify-center items-center py-8">
                  <Loader size="small" />
                </div>
              ) : (
                <AdditionalServicesTable services={additionalServices} />
              )}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default DoctorBillingPage;
