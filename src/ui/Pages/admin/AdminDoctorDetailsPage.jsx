import React, { useMemo, useState, useEffect } from 'react';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import { Link, useLoaderData, useNavigate, useParams } from 'react-router';

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
  const statusConfig = {
    unpaid: {
      color: 'error',
      text: 'Unpaid',
    },
    partially_paid: {
      color: 'warning',
      text: `${paymentPercentage.toFixed(0)}% Paid`,
    },
    paid: {
      color: 'success',
      text: 'Paid',
    },
    not_applicable: {
      color: 'neutral',
      text: 'No Cost',
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
  const { doctor, cases, error } = useLoaderData();
  const navigate = useNavigate();
  const { doctorId } = useParams();

  const [searchQuery, setSearchQuery] = useState('');
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [casesWithPaymentInfo, setCasesWithPaymentInfo] = useState([]);
  const [paymentAllocations, setPaymentAllocations] = useState([]);
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

        setPaymentAllocations(payments || []);

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

      setPaymentAllocations(payments || []);

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
            <Breadcrumbs.Item>Doctors</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>Doctor Details</Breadcrumbs.Item>
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
                  Phone Number
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.phone || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Email
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.email || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Clinic Name
                </span>
                <span className="text-caption font-caption text-subtext-color">
                  {doctor?.clinic || '—'}
                </span>
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
                <span className="text-body-bold font-body-bold text-default-font">
                  Clinic Address
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
                Total Patients
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
                Active Cases
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
                Due Payments
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
              All Cases
            </span>
            <div className="flex items-center gap-4">
              {totalDueAmount > 0 && (
                <Button
                  onClick={() => setPaymentDialogOpen(true)}
                  icon={<FeatherDollarSign />}
                  className="w-auto"
                >
                  Collect Payment
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
                  placeholder="Search cases..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </TextField>
            </div>
          </div>
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>Patient Name</Table.HeaderCell>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Case Status</Table.HeaderCell>
                <Table.HeaderCell>Payment Status</Table.HeaderCell>
                <Table.HeaderCell>Total Cost</Table.HeaderCell>
                <Table.HeaderCell>Paid Amount</Table.HeaderCell>
                <Table.HeaderCell>Remaining</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {!filteredCases || filteredCases.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={7}>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500 py-4">
                    {loadingPaymentData ? <Loader /> : 'No cases found.'}
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
