import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import { Link, useLoaderData, useNavigate } from 'react-router';

import Error from '../../components/Error';
import { Table } from '../../components/Table';
import { Avatar } from '../../components/Avatar';
import { IconWithBackground } from '../../components/IconWithBackground';
import { TextField } from '../../components/TextField';
import { Badge } from '../../components/Badge';
import CaseStatusBadge from '../../components/CaseStatusBadge';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Button } from '../../components/Button';
import { FeatherDollarSign, FeatherCreditCard } from '@subframe/core';

import supabase from '../../../helper/supabaseClient';
import PaymentCollectionDialog from '../../components/billing/PaymentCollectionDialog';
import { Loader } from '../../components/Loader';

// Payment status component with derived status
const PaymentStatusBadge = ({ paymentStatus, paymentPercentage = 0 }) => {
  const { t } = useTranslation();

  const statusConfig = {
    unpaid: {
      color: 'error',
      text: t('billing.table.paymentStatus.unpaid'),
    },
    partially_paid: {
      color: 'warning',
      text: t('adminDoctorDetails.partialPayment', {
        percent: paymentPercentage.toFixed(0),
      }),
    },
    paid: {
      color: 'success',
      text: t('billing.table.paymentStatus.paid'),
    },
    not_applicable: {
      color: 'neutral',
      text: t('billing.table.paymentStatus.na'),
    },
  };

  const config = statusConfig[paymentStatus] || statusConfig.unpaid;

  return <Badge variant={config.color}>{config.text}</Badge>;
};

// Helper function to calculate case payment info (same as in your hook)
const calculateCasePaymentInfo = (case_, allPayments = []) => {
  const totalCost = parseFloat(case_.total_cost || 0);

  if (totalCost <= 0) {
    return {
      remainingAmount: 0,
      paymentStatus: 'not_applicable',
      totalPaid: 0,
      paymentPercentage: 0,
    };
  }

  const casePayments = allPayments.filter(
    (payment) => payment.case_id === case_.id
  );

  const totalPaid = casePayments.reduce((sum, payment) => {
    return sum + parseFloat(payment.allocated_amount || 0);
  }, 0);

  const remainingAmount = Math.max(0, totalCost - totalPaid);
  const paymentPercentage = totalCost > 0 ? (totalPaid / totalCost) * 100 : 0;

  let paymentStatus;
  if (remainingAmount === 0 && totalPaid > 0) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partially_paid';
  } else {
    paymentStatus = 'unpaid';
  }

  return {
    remainingAmount,
    paymentStatus,
    totalPaid,
    paymentPercentage: Math.round(paymentPercentage * 100) / 100,
  };
};

export default function AdminDoctorDetailsPage() {
  const { t } = useTranslation();
  const { doctor, cases, error } = useLoaderData();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [casesWithPaymentInfo, setCasesWithPaymentInfo] = useState([]);
  const [loadingPaymentData, setLoadingPaymentData] = useState(true);

  // Load payment data
  useEffect(() => {
    const loadPaymentData = async () => {
      if (!cases?.length) {
        setLoadingPaymentData(false);
        return;
      }

      try {
        const caseIds = cases.map((c) => c.id);
        const { data: payments, error: paymentsError } = await supabase
          .from('payment_case_allocations')
          .select('case_id, allocated_amount')
          .in('case_id', caseIds);

        if (paymentsError) throw paymentsError;

        const casesWithPayment = cases.map((case_) => {
          const paymentInfo = calculateCasePaymentInfo(case_, payments || []);
          return {
            ...case_,
            ...paymentInfo,
          };
        });

        setCasesWithPaymentInfo(casesWithPayment);
      } catch (err) {
        console.error('Error loading payment data:', err);
      } finally {
        setLoadingPaymentData(false);
      }
    };

    loadPaymentData();
  }, [cases]);

  const doctorInitial = useMemo(() => {
    const name = doctor?.full_name || '';
    return name.trim().charAt(0).toUpperCase() || 'D';
  }, [doctor]);

  const uniquePatientsCount = useMemo(() => {
    if (!Array.isArray(cases)) return 0;
    const normalizedNames = cases.map((c) =>
      `${(c.first_name || '').toLowerCase()} ${(
        c.last_name || ''
      ).toLowerCase()}`.trim()
    );
    return new Set(normalizedNames).size;
  }, [cases]);

  const activeStatuses = useMemo(
    () =>
      new Set([
        'submitted',
        'accepted',
        'under_review',
        'awaiting_patient_approval',
        'awaiting_user_approval',
        'approved',
        'in_production',
        'ready_for_delivery',
      ]),
    []
  );

  const activeCasesCount = useMemo(() => {
    if (!Array.isArray(cases)) return 0;
    return cases.filter((c) => activeStatuses.has(c.status)).length;
  }, [cases, activeStatuses]);

  // Calculate total due amount for this doctor
  const totalDueAmount = useMemo(() => {
    return casesWithPaymentInfo.reduce((sum, case_) => {
      return sum + (case_.remainingAmount || 0);
    }, 0);
  }, [casesWithPaymentInfo]);

  const filteredCases = useMemo(() => {
    if (!Array.isArray(casesWithPaymentInfo)) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return casesWithPaymentInfo;
    return casesWithPaymentInfo.filter((c) =>
      `${(c.first_name || '').toLowerCase()} ${(
        c.last_name || ''
      ).toLowerCase()}`.includes(q)
    );
  }, [casesWithPaymentInfo, searchQuery]);

  const handlePaymentSuccess = async () => {
    // Reload payment data after successful payment
    setLoadingPaymentData(true);
    try {
      const caseIds = cases.map((c) => c.id);
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_case_allocations')
        .select('case_id, allocated_amount')
        .in('case_id', caseIds);

      if (paymentsError) throw paymentsError;

      const casesWithPayment = cases.map((case_) => {
        const paymentInfo = calculateCasePaymentInfo(case_, payments || []);
        return {
          ...case_,
          ...paymentInfo,
        };
      });

      setCasesWithPaymentInfo(casesWithPayment);
    } catch (err) {
      console.error('Error reloading payment data:', err);
    } finally {
      setLoadingPaymentData(false);
    }
  };

  if (error) {
    return <Error error={error} />;
  }

  // Create doctor object compatible with PaymentCollectionDialog
  const doctorForPayment = doctor
    ? {
        ...doctor,
        totalDueAmount,
        unpaidCasesCount: casesWithPaymentInfo.filter(
          (c) => c.remainingAmount > 0
        ).length,
      }
    : null;

  return (
    <>
      {/* Header section with avatar and doctor details */}
      <div className="flex w-full flex-wrap items-center gap-8">
        <Breadcrumbs>
          <Link to="/admin/doctors">
            <Breadcrumbs.Item>{t('navigation.doctors')}</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>
            {t('adminDoctorDetails.breadcrumbTitle')}
          </Breadcrumbs.Item>
        </Breadcrumbs>
        <div className="flex w-full flex-wrap items-start gap-4">
          <Avatar size="x-large" image={doctor?.avatar_url || undefined}>
            {!doctor?.avatar_url ? doctorInitial : null}
          </Avatar>
          <div className="flex min-w-[160px] grow shrink-0 basis-0 flex-col items-start gap-6 pt-4">
            <div className="flex w-full items-center justify-between">
              <span className="text-heading-2 font-heading-2 text-default-font">
                {capitalizeFirstSafe(doctor?.full_name) || '—'}
              </span>
            </div>
            <div className="flex w-full flex-wrap items-start gap-6">
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  {t('profile.phoneNumber')}
                </span>
                <span
                  dir="ltr"
                  className="text-caption font-caption text-subtext-color"
                >
                  {doctor?.phone || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  {t('profile.email')}
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.email || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  {t('profile.clinicName')}
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.clinic || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  {t('profile.clinicAddress')}
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.address || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats + Recent Cases */}
      <div className="flex w-full grow flex-col items-start gap-8 bg-default-background px-12 py-6 overflow-auto">
        <div className="flex w-full flex-wrap items-start gap-4">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <div className="flex items-center gap-2">
              <IconWithBackground />
              <span className="text-heading-3 font-heading-3 text-default-font">
                {t('adminDoctorDetails.totalPatients')}
              </span>
            </div>
            <span className="text-heading-1 font-heading-1 text-default-font">
              {uniquePatientsCount.toLocaleString()}
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <div className="flex items-center gap-2">
              <IconWithBackground variant="success" />
              <span className="text-heading-3 font-heading-3 text-default-font">
                {t('adminDoctorDetails.activeCases')}
              </span>
            </div>
            <span className="text-heading-1 font-heading-1 text-default-font">
              {activeCasesCount.toLocaleString()}
            </span>
          </div>
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6">
            <div className="flex items-center gap-2">
              <IconWithBackground
                variant={totalDueAmount > 0 ? 'warning' : 'success'}
              />
              <span className="text-heading-3 font-heading-3 text-default-font">
                {t('billingStats.duePayments')}
              </span>
            </div>
            <span
              className={`text-heading-1 font-heading-1 ${
                totalDueAmount > 0 ? 'text-warning-600' : 'text-success-600'
              }`}
            >
              {loadingPaymentData ? '...' : `$${totalDueAmount.toFixed(2)}`}
            </span>
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full items-center justify-between">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('cases.title')}
            </span>
            <div className="flex items-center gap-4">
              {totalDueAmount > 0 && (
                <Button
                  onClick={() => setPaymentDialogOpen(true)}
                  icon={<FeatherDollarSign />}
                  className="w-auto"
                >
                  {t('billing.receivePayment')}
                </Button>
              )}
              {/*totalDueAmount > 0 && (
                <Button
                  variant="neutral-secondary"
                  onClick={() => setPaymentDialogOpen(true)}
                  icon={<FeatherCreditCard />}
                  size="small"
                >
                  Quick Pay
                </Button>
              )*/}
              <TextField variant="filled" label="" helpText="">
                <TextField.Input
                  placeholder={t('dashboard.searchCases')}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </TextField>
            </div>
          </div>
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>{t('cases.patientName')}</Table.HeaderCell>
                <Table.HeaderCell>
                  {t('transactions.table.date')}
                </Table.HeaderCell>
                <Table.HeaderCell>{t('cases.status')}</Table.HeaderCell>
                <Table.HeaderCell>
                  {t('adminDoctorDetails.paymentStatus')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('casePage.treatmentPlan.totalCost')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('adminDoctorDetails.paidAmount')}
                </Table.HeaderCell>
                <Table.HeaderCell>
                  {t('adminDoctorDetails.remainingAmount')}
                </Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {!filteredCases || filteredCases.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500 py-4">
                    {loadingPaymentData ? <Loader /> : t('cases.noCases')}
                  </span>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredCases.map((c) => (
                <Table.Row
                  key={c.id}
                  clickable
                  onClick={() => navigate(`/admin/cases/${c.id}`)}
                >
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                      {capitalizeFirstSafe(c.first_name)}{' '}
                      {capitalizeFirstSafe(c.last_name)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString()
                        : '—'}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <CaseStatusBadge status={c.status} />
                  </Table.Cell>
                  <Table.Cell>
                    <PaymentStatusBadge
                      paymentStatus={c.paymentStatus || 'unpaid'}
                      paymentPercentage={c.paymentPercentage || 0}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      ${parseFloat(c.total_cost || 0).toFixed(2)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-success-600">
                      ${(c.totalPaid || 0).toFixed(2)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span
                      className={`whitespace-nowrap text-body font-body ${
                        (c.remainingAmount || 0) > 0
                          ? 'text-warning-600'
                          : 'text-success-600'
                      }`}
                    >
                      ${(c.remainingAmount || 0).toFixed(2)}
                    </span>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table>
        </div>
      </div>

      {/* Payment Collection Dialog */}
      {doctorForPayment && (
        <PaymentCollectionDialog
          isOpen={paymentDialogOpen}
          onClose={() => setPaymentDialogOpen(false)}
          doctors={[doctorForPayment]}
          initialDoctor={doctorForPayment}
          refetchBillingData={handlePaymentSuccess}
        />
      )}
    </>
  );
}
