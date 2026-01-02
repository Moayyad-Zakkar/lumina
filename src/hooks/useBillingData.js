import { useState, useEffect, useCallback } from 'react';

import toast from 'react-hot-toast';
import supabase from '../helper/supabaseClient';

// Enhanced helper function to calculate case payment info and status
const calculateCasePaymentInfo = (case_, allPayments = []) => {
  const totalCost = parseFloat(case_.approved_total_cost || 0);

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

// Backward compatibility function (you can remove this once you update all references)
export const calculateCaseRemainingAmount = (case_, allPayments = []) => {
  return calculateCasePaymentInfo(case_, allPayments).remainingAmount;
};

// Custom hook for managing billing data
export const useBillingData = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all doctors with their cases
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
            approved_total_cost,
            created_at,
            status,
            first_name,
            last_name
          )
        `
        )
        .eq('role', 'user');

      if (doctorsError) throw doctorsError;

      // Get all payment allocations
      const { data: allPayments, error: paymentsError } = await supabase
        .from('payment_case_allocations')
        .select('case_id, allocated_amount');

      if (paymentsError) throw paymentsError;

      // Get actual payment records with dates
      const { data: paymentRecords, error: paymentRecordsError } =
        await supabase
          .from('payments')
          .select('doctor_id, created_at, amount, type')
          .order('created_at', { ascending: false });

      if (paymentRecordsError) throw paymentRecordsError;

      // Process doctors with billing calculations
      const doctorsWithBilling = doctorsData.map((doctor) => {
        const casesWithPaymentInfo = doctor.cases.map((case_) => {
          const paymentInfo = calculateCasePaymentInfo(
            case_,
            allPayments || []
          );
          return {
            ...case_,
            ...paymentInfo, // This adds remainingAmount, paymentStatus, totalPaid, paymentPercentage
          };
        });

        const unpaidCases = casesWithPaymentInfo.filter(
          (case_) => case_.remainingAmount > 0
        );

        const totalDueAmount = unpaidCases.reduce(
          (sum, case_) => sum + case_.remainingAmount,
          0
        );

        // Get last payment date from actual payment records (only received payments)
        const doctorPayments = paymentRecords.filter(
          (payment) =>
            payment.doctor_id === doctor.id && payment.type === 'payment'
        );
        const lastPaymentDate =
          doctorPayments.length > 0 ? doctorPayments[0].created_at : null;

        return {
          ...doctor,
          cases: casesWithPaymentInfo,
          totalCases: doctor.cases.length,
          unpaidCasesCount: unpaidCases.length,
          totalDueAmount,
          lastPaymentDate,
          paymentStatus: totalDueAmount > 0 ? 'due' : 'current',
        };
      });

      setDoctors(doctorsWithBilling);

      // Calculate total expenses
      const totalDueAmount = doctorsWithBilling.reduce(
        (sum, doctor) => sum + doctor.totalDueAmount,
        0
      );

      const totalExpensesAmount = (paymentRecords || [])
        .filter((payment) => payment.type === 'expense')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

      // Calculate total payments received
      const totalPaymentsAmount = (paymentRecords || [])
        .filter((payment) => payment.type === 'payment')
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);

      // Net earnings = payments - expenses
      const totalEarningsAmount = totalPaymentsAmount - totalExpensesAmount;

      setTotalEarnings(totalEarningsAmount);
      setTotalDue(totalDueAmount);
      setTotalExpenses(totalExpensesAmount);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  return {
    doctors,
    loading,
    error,
    totalEarnings,
    totalDue,
    totalExpenses,
    refetchBillingData: fetchBillingData,
  };
};

// Custom hook for managing doctor cases
export const useDoctorCases = () => {
  const [doctorCases, setDoctorCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);

  const loadDoctorCases = useCallback(async (doctorId) => {
    if (!doctorId) {
      setDoctorCases([]);
      return;
    }

    try {
      setLoadingCases(true);

      // Get all cases for this doctor
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select('*')
        .eq('user_id', doctorId);

      if (casesError) throw casesError;

      // Get payment allocations for these cases
      const caseIds = (casesData || []).map((c) => c.id);
      const { data: payments, error: paymentsError } = await supabase
        .from('payment_case_allocations')
        .select('case_id, allocated_amount')
        .in('case_id', caseIds);

      if (paymentsError) throw paymentsError;

      // Filter cases that have remaining amounts to be paid
      const billableCases = (casesData || [])
        .map((case_) => {
          const paymentInfo = calculateCasePaymentInfo(case_, payments || []);
          return {
            ...case_,
            ...paymentInfo,
          };
        })
        .filter((case_) => case_.remainingAmount > 0);

      setDoctorCases(billableCases);
    } catch (err) {
      console.error('Error fetching doctor cases:', err);
      toast.error('Failed to load doctor cases');
      setDoctorCases([]);
    } finally {
      setLoadingCases(false);
    }
  }, []);

  return {
    doctorCases,
    loadingCases,
    loadDoctorCases,
  };
};

// Custom hook for payment processing logic
export const usePaymentProcessor = (refetchBillingData) => {
  const [processingPayment, setProcessingPayment] = useState(false);

  const processPayment = useCallback(
    async (paymentData) => {
      const {
        selectedDoctor,
        paymentAmount,
        selectedCases,
        doctorCases,
        paymentNotes,
      } = paymentData;

      if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
        toast.error('Please enter a valid payment amount');
        return false;
      }

      if (selectedDoctor && selectedCases.size === 0) {
        toast.error('Please select at least one case for this doctor');
        return false;
      }

      try {
        setProcessingPayment(true);

        const paymentAmountNum = parseFloat(paymentAmount);
        const {
          data: { user },
        } = await supabase.auth.getUser();

        // Create payment record (received payment)
        const { data: paymentRecord, error: paymentError } = await supabase
          .from('payments')
          .insert({
            doctor_id: selectedDoctor?.id || null,
            amount: paymentAmountNum,
            admin_id: user.id,
            notes: paymentNotes.trim() || null,
            type: 'payment', // Explicitly mark as received payment
          })
          .select()
          .single();

        if (paymentError) throw paymentError;

        // Handle case-specific payment allocation
        if (selectedDoctor && selectedCases.size > 0) {
          const selectedCasesTotal = doctorCases
            .filter((case_) => selectedCases.has(case_.id))
            .reduce((sum, case_) => sum + case_.remainingAmount, 0);

          const remainingAmount = Math.max(
            0,
            paymentAmountNum - selectedCasesTotal
          );
          const unselectedCases = doctorCases.filter(
            (case_) => !selectedCases.has(case_.id)
          );
          const allocations = [];

          // Allocate proportionally to selected cases
          if (selectedCasesTotal > 0) {
            for (const caseId of selectedCases) {
              const case_ = doctorCases.find((c) => c.id === caseId);
              if (case_) {
                const caseShare = case_.remainingAmount / selectedCasesTotal;
                const allocationAmount = Math.min(
                  paymentAmountNum * caseShare,
                  case_.remainingAmount
                );

                allocations.push({
                  payment_id: paymentRecord.id,
                  case_id: caseId,
                  allocated_amount: allocationAmount,
                });
              }
            }
          }

          // Distribute remaining amount among unselected cases
          if (remainingAmount > 0 && unselectedCases.length > 0) {
            const amountPerCase = remainingAmount / unselectedCases.length;
            for (const case_ of unselectedCases) {
              const allocationAmount = Math.min(
                amountPerCase,
                case_.remainingAmount
              );
              allocations.push({
                payment_id: paymentRecord.id,
                case_id: case_.id,
                allocated_amount: allocationAmount,
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
        }

        toast.success('Payment processed successfully!');

        // Refresh data after successful payment
        setTimeout(() => {
          refetchBillingData();
        }, 1000);

        return paymentRecord;
      } catch (err) {
        console.error('Payment processing failed:', err);
        toast.error(err.message || 'Failed to process payment');
        return false;
      } finally {
        setProcessingPayment(false);
      }
    },
    [refetchBillingData]
  );

  return {
    processingPayment,
    processPayment,
  };
};
