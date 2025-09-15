import React, { useState, useEffect } from 'react';

import { Avatar } from '../../components/Avatar';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Table } from '../../components/Table';
import { TextField } from '../../components/TextField';
import { Dialog } from '../../components/Dialog';
import { Loader } from '../../components/Loader';
import Error from '../../components/Error';

import { FeatherArrowDown } from '@subframe/core';
import { FeatherArrowUp } from '@subframe/core';
import { FeatherLogs } from '@subframe/core';
import { FeatherSearch } from '@subframe/core';
import { FeatherDollarSign } from '@subframe/core';
import { FeatherCheck } from '@subframe/core';
import { FeatherX } from '@subframe/core';

import supabase from '../../../helper/supabaseClient';
import toast from 'react-hot-toast';

function AdminBillingPage() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDue, setTotalDue] = useState(0);

  // Payment collection dialog state
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorCases, setDoctorCases] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedCases, setSelectedCases] = useState(new Set());
  const [paymentNotes, setPaymentNotes] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [loadingCases, setLoadingCases] = useState(false);

  // Fetch doctors with their billing data
  useEffect(() => {
    const fetchBillingData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all doctors with their cases and payment data
        const { data: doctorsData, error: doctorsError } = await supabase
          .from('profiles')
          .select(
            `
            id,
            full_name,
            avatar_url,
            phone,
            clinic,
            cases:cases!user_id (
              id,
              total_cost,
              payment_status,
              created_at,
              status
            )
          `
          )
          .eq('role', 'user');

        if (doctorsError) throw doctorsError;

        // Calculate billing data for each doctor
        const doctorsWithBilling = doctorsData.map((doctor) => {
          const unpaidCases = doctor.cases.filter(
            (case_) =>
              case_.payment_status === 'unpaid' &&
              [
                'accepted',
                'awaiting_user_approval',
                'user_rejected',
                'approved',
                'in_production',
                'ready_for_delivery',
                'delivered',
                'completed',
              ].includes(case_.status)
          );

          const totalDueAmount = unpaidCases.reduce(
            (sum, case_) => sum + parseFloat(case_.total_cost || 0),
            0
          );

          const totalCases = doctor.cases.length;
          const unpaidCasesCount = unpaidCases.length;

          // Get last payment date
          const lastPaymentDate = doctor.cases
            .filter((case_) => case_.payment_status === 'paid')
            .sort(
              (a, b) => new Date(b.created_at) - new Date(a.created_at)
            )[0]?.created_at;

          return {
            ...doctor,
            totalCases,
            unpaidCasesCount,
            totalDueAmount,
            lastPaymentDate,
            status:
              totalDueAmount > 0
                ? totalDueAmount > 10000
                  ? 'overdue'
                  : 'pending'
                : 'current',
          };
        });

        setDoctors(doctorsWithBilling);

        // Calculate totals
        const totalEarningsAmount = doctorsWithBilling.reduce(
          (sum, doctor) =>
            sum +
            doctor.cases
              .filter((case_) => case_.payment_status === 'paid')
              .reduce(
                (caseSum, case_) => caseSum + parseFloat(case_.total_cost || 0),
                0
              ),
          0
        );

        const totalDueAmount = doctorsWithBilling.reduce(
          (sum, doctor) => sum + doctor.totalDueAmount,
          0
        );

        setTotalEarnings(totalEarningsAmount);
        setTotalDue(totalDueAmount);
      } catch (err) {
        console.error('Error fetching billing data:', err);
        setError(err.message || 'Failed to load billing data');
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  // Filter doctors based on search term
  const filteredDoctors = doctors.filter(
    (doctor) =>
      doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.clinic?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCollectPayment = async (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedCases(new Set());
    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentDialog(true);

    // Load doctor's cases
    await loadDoctorCases(doctor.id);
  };

  const handleReceivePayment = () => {
    setSelectedDoctor(null);
    setDoctorCases([]);
    setSelectedCases(new Set());
    setPaymentAmount('');
    setPaymentNotes('');
    setShowPaymentDialog(true);
  };

  const loadDoctorCases = async (doctorId) => {
    if (!doctorId) {
      setDoctorCases([]);
      return;
    }

    try {
      setLoadingCases(true);
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', doctorId)
        .eq('payment_status', 'unpaid')
        .in('status', [
          'approved',
          'in_production',
          'ready_for_delivery',
          'delivered',
          'completed',
        ]);

      if (casesError) throw casesError;
      setDoctorCases(casesData || []);
    } catch (err) {
      console.error('Error fetching doctor cases:', err);
      toast.error('Failed to load doctor cases');
      setDoctorCases([]);
    } finally {
      setLoadingCases(false);
    }
  };

  const handleDoctorChange = async (doctorId) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    setSelectedDoctor(doctor || null);
    setSelectedCases(new Set());
    await loadDoctorCases(doctorId);
  };

  const handleClosePaymentDialog = () => {
    setShowPaymentDialog(false);
    setSelectedDoctor(null);
    setDoctorCases([]);
    setSelectedCases(new Set());
    setPaymentAmount('');
    setPaymentNotes('');
  };

  const handleCaseSelection = (caseId, checked) => {
    const newSelectedCases = new Set(selectedCases);
    if (checked) {
      newSelectedCases.add(caseId);
    } else {
      newSelectedCases.delete(caseId);
    }
    setSelectedCases(newSelectedCases);
  };

  const calculateSelectedCasesTotal = () => {
    return doctorCases
      .filter((case_) => selectedCases.has(case_.id))
      .reduce((sum, case_) => sum + parseFloat(case_.total_cost || 0), 0);
  };

  const calculateRemainingAmount = () => {
    const selectedTotal = calculateSelectedCasesTotal();
    const paymentAmountNum = parseFloat(paymentAmount || 0);
    return Math.max(0, paymentAmountNum - selectedTotal);
  };

  const getUnselectedCases = () => {
    return doctorCases.filter((case_) => !selectedCases.has(case_.id));
  };

  const processPayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (selectedDoctor && selectedCases.size === 0) {
      toast.error('Please select at least one case for this doctor');
      return;
    }

    try {
      setProcessingPayment(true);

      const paymentAmountNum = parseFloat(paymentAmount);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Create payment record
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          doctor_id: selectedDoctor?.id || null,
          amount: paymentAmountNum,
          admin_id: user.id,
          notes: paymentNotes.trim() || null,
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Handle case-specific payment (when doctor is selected)
      if (selectedDoctor && selectedCases.size > 0) {
        const remainingAmount = calculateRemainingAmount();
        const unselectedCases = getUnselectedCases();

        // Allocate payment to selected cases
        const allocations = [];
        for (const caseId of selectedCases) {
          const case_ = doctorCases.find((c) => c.id === caseId);
          const caseAmount = parseFloat(case_.total_cost || 0);
          allocations.push({
            payment_id: paymentData.id,
            case_id: caseId,
            allocated_amount: caseAmount,
          });
        }

        // If there's remaining amount, split it among unselected cases
        if (remainingAmount > 0 && unselectedCases.length > 0) {
          const amountPerCase = remainingAmount / unselectedCases.length;
          for (const case_ of unselectedCases) {
            allocations.push({
              payment_id: paymentData.id,
              case_id: case_.id,
              allocated_amount: amountPerCase,
            });
          }
        }

        // Insert allocations
        if (allocations.length > 0) {
          const { error: allocationError } = await supabase
            .from('payment_case_allocations')
            .insert(allocations);

          if (allocationError) throw allocationError;
        }

        // Update case payment statuses
        const caseIdsToUpdate = [...selectedCases];
        if (remainingAmount > 0) {
          caseIdsToUpdate.push(...unselectedCases.map((c) => c.id));
        }

        if (caseIdsToUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from('cases')
            .update({ payment_status: 'paid' })
            .in('id', caseIdsToUpdate);

          if (updateError) throw updateError;
        }
      }

      toast.success('Payment processed successfully!');
      handleClosePaymentDialog();

      // Refresh the billing data
      window.location.reload(); // Simple refresh for now
    } catch (err) {
      console.error('Error processing payment:', err);
      toast.error(err.message || 'Failed to process payment');
    } finally {
      setProcessingPayment(false);
    }
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
        <div className="flex w-full flex-wrap items-center gap-2">
          <span className="grow shrink-0 basis-0 text-heading-2 font-heading-2 text-default-font">
            Billing Management
          </span>
          <Button
            variant="neutral-secondary"
            icon={<FeatherLogs />}
            className="w-auto"
          >
            Transaction Log
          </Button>
        </div>
        <div className="flex w-full flex-wrap items-start gap-4">
          <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
            <div className="flex w-full flex-col items-start gap-2">
              <span className="text-body font-body text-subtext-color">
                Total Earnings
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
                  all time
                </span>
              </div>
            </div>
            <Button
              className="h-10 w-full flex-none"
              icon={<FeatherArrowDown />}
              onClick={handleReceivePayment}
            >
              Receive Payment
            </Button>
          </div>
          <div className="flex min-w-[240px] grow shrink-0 basis-0 flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-8 py-8 shadow-sm">
            <div className="flex w-full flex-col items-start gap-2">
              <span className="text-body font-body text-subtext-color">
                Due Payments
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
                  outstanding
                </span>
              </div>
            </div>
            <Button
              className="h-10 w-full flex-none"
              variant="destructive-primary"
              icon={<FeatherArrowUp />}
            >
              Make Payment
            </Button>
          </div>
        </div>
      </div>
      <div className="flex w-full flex-col items-start gap-6">
        <div className="flex w-full items-center gap-2">
          <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
            Doctors Billing
          </span>
          <TextField
            variant="filled"
            label=""
            helpText=""
            icon={<FeatherSearch />}
          >
            <TextField.Input
              placeholder="Search doctors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </TextField>
        </div>
        <Table
          header={
            <Table.HeaderRow>
              <Table.HeaderCell>Doctor</Table.HeaderCell>
              <Table.HeaderCell>Cases</Table.HeaderCell>
              <Table.HeaderCell>Due Amount</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Last Payment</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.HeaderRow>
          }
        >
          {filteredDoctors.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={6}>
                <div className="text-center py-8 text-neutral-500">
                  {searchTerm
                    ? 'No doctors found matching your search.'
                    : 'No doctors found.'}
                </div>
              </Table.Cell>
            </Table.Row>
          ) : (
            filteredDoctors.map((doctor) => (
              <Table.Row key={doctor.id}>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Avatar size="small" image={doctor.avatar_url}>
                      {doctor.full_name?.charAt(0) || 'D'}
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                        {doctor.full_name || 'Unknown Doctor'}
                      </span>
                      {doctor.clinic && (
                        <span className="text-caption font-caption text-subtext-color">
                          {doctor.clinic}
                        </span>
                      )}
                    </div>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="text-body font-body text-neutral-500">
                      {doctor.totalCases} total
                    </span>
                    <span className="text-caption font-caption text-error-600">
                      {doctor.unpaidCasesCount} unpaid
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span
                    className={`text-body-bold font-body-bold ${
                      doctor.totalDueAmount > 0
                        ? doctor.totalDueAmount > 10000
                          ? 'text-error-600'
                          : 'text-warning-600'
                        : 'text-success-600'
                    }`}
                  >
                    $
                    {doctor.totalDueAmount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge
                    variant={
                      doctor.status === 'overdue'
                        ? 'error'
                        : doctor.status === 'pending'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {doctor.status === 'overdue'
                      ? 'Overdue'
                      : doctor.status === 'pending'
                      ? 'Pending'
                      : 'Current'}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="text-body font-body text-neutral-500">
                    {doctor.lastPaymentDate
                      ? new Date(doctor.lastPaymentDate).toLocaleDateString()
                      : 'Never'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Button
                    size="small"
                    onClick={() => handleCollectPayment(doctor)}
                    disabled={doctor.totalDueAmount === 0}
                  >
                    Collect Payment
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table>
      </div>

      {/* Payment Collection Dialog */}
      {showPaymentDialog && (
        <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
          <Dialog.Content className="p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start gap-3 mb-6">
              <FeatherDollarSign className="h-6 w-6 text-brand-600 mt-1" />
              <div>
                <h2 className="text-heading-3 font-heading-3 text-default-font">
                  Collect Payment
                </h2>
                <p className="text-body font-body text-subtext-color mt-1">
                  Enter payment details and select cases to allocate the
                  payment.
                </p>
              </div>
            </div>

            <div className="space-y-6 w-full">
              {/* Doctor Selection */}
              <div className="flex flex-col gap-2 w-auto">
                <label className="text-body-bold font-body-bold text-default-font">
                  Doctor *
                </label>
                <select
                  value={selectedDoctor?.id || ''}
                  onChange={(e) => handleDoctorChange(e.target.value)}
                  className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a doctor...</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>
                      {doctor.full_name}{' '}
                      {doctor.clinic ? `(${doctor.clinic})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Amount */}
              <div className="flex flex-col gap-2">
                <label className="text-body-bold font-body-bold text-default-font">
                  Payment Amount *
                </label>
                <TextField>
                  <TextField.Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </TextField>
              </div>

              {/* Payment Notes */}
              <div className="flex flex-col gap-2">
                <label className="text-body-bold font-body-bold text-default-font">
                  Notes (Optional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Add any notes about this payment..."
                  rows={3}
                  className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
                />
              </div>

              {/* Cases Section */}
              {selectedDoctor && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-heading-4 font-heading-4 text-default-font">
                      Unpaid Cases
                    </h3>
                    {doctorCases.length > 0 && (
                      <div className="text-sm text-subtext-color">
                        {selectedCases.size} of {doctorCases.length} selected
                      </div>
                    )}
                  </div>

                  {loadingCases ? (
                    <div className="text-center py-8 text-neutral-500">
                      Loading cases...
                    </div>
                  ) : doctorCases.length > 0 ? (
                    <div className="border border-neutral-border rounded-md max-h-60 overflow-y-auto">
                      {doctorCases.map((case_) => (
                        <div
                          key={case_.id}
                          className="flex items-center gap-3 p-3 border-b border-neutral-border last:border-b-0 hover:bg-neutral-50"
                        >
                          <input
                            type="checkbox"
                            id={`case-${case_.id}`}
                            checked={selectedCases.has(case_.id)}
                            onChange={(e) =>
                              handleCaseSelection(case_.id, e.target.checked)
                            }
                            className="w-4 h-4 text-brand-600 border-neutral-border rounded focus:ring-brand-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <label
                                htmlFor={`case-${case_.id}`}
                                className="text-body font-body text-default-font cursor-pointer"
                              >
                                Case #{case_.id} - {case_.first_name}{' '}
                                {case_.last_name}
                              </label>
                              <span className="text-body-bold font-body-bold text-default-font">
                                ${parseFloat(case_.total_cost || 0).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-caption font-caption text-subtext-color">
                              Status: {case_.status} | Created:{' '}
                              {new Date(case_.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-neutral-500 border border-neutral-border rounded-md">
                      No unpaid cases found for this doctor.
                    </div>
                  )}

                  {/* Payment Summary */}
                  {paymentAmount && doctorCases.length > 0 && (
                    <div className="bg-neutral-50 border border-neutral-border rounded-md p-4 space-y-2">
                      <div className="flex justify-between text-body font-body">
                        <span>Selected Cases Total:</span>
                        <span className="font-bold">
                          ${calculateSelectedCasesTotal().toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-body font-body">
                        <span>Payment Amount:</span>
                        <span className="font-bold">
                          ${parseFloat(paymentAmount || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-body font-body border-t border-neutral-border pt-2">
                        <span>Remaining Amount:</span>
                        <span
                          className={`font-bold ${
                            calculateRemainingAmount() > 0
                              ? 'text-warning-600'
                              : 'text-success-600'
                          }`}
                        >
                          ${calculateRemainingAmount().toFixed(2)}
                        </span>
                      </div>
                      {calculateRemainingAmount() > 0 &&
                        getUnselectedCases().length > 0 && (
                          <div className="text-caption font-caption text-subtext-color">
                            Remaining amount will be split among{' '}
                            {getUnselectedCases().length} unselected cases
                          </div>
                        )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dialog Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-neutral-border w-full">
              <Button
                variant="neutral-secondary"
                onClick={handleClosePaymentDialog}
                disabled={processingPayment}
              >
                Cancel
              </Button>
              <Button
                onClick={processPayment}
                disabled={
                  processingPayment ||
                  !paymentAmount ||
                  parseFloat(paymentAmount) <= 0 ||
                  !selectedDoctor
                }
                icon={<FeatherCheck />}
              >
                {processingPayment ? 'Processing...' : 'Process Payment'}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog>
      )}
    </>
  );
}

export default AdminBillingPage;
