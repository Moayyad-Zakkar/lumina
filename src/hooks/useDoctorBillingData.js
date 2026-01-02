import { useState, useEffect, useCallback } from 'react';
import supabase from '../helper/supabaseClient';

// Helper function to calculate case payment info (reused from your admin hook)
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

// Custom hook for doctor's billing data
export const useDoctorBillingData = () => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCases, setTotalCases] = useState(0);
  const [totalDue, setTotalDue] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [pendingCases, setPendingCases] = useState(0);
  const [completedCases, setCompletedCases] = useState(0);

  const fetchBillingData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current authenticated user (doctor)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      // Get doctor's cases with correct column names from schema
      const { data: casesData, error: casesError } = await supabase
        .from('cases')
        .select(
          `
          id,
          first_name,
          last_name,
          approved_total_cost,
          created_at,
          status,
          payment_status,
          aligner_material,
          printing_method,
          upper_jaw_aligners,
          lower_jaw_aligners,
          estimated_duration_months,
          refinement_number,
          treatment_arch,
          is_urgent,
          case_study_fee,
          aligners_price,
          delivery_charges,
          user_note,
          admin_note
        `
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (casesError) throw casesError;

      // Get payment allocations for these cases
      const caseIds = (casesData || []).map((c) => c.id);
      let allPayments = [];

      if (caseIds.length > 0) {
        const { data: allPaymentsData, error: paymentsError } = await supabase
          .from('payment_case_allocations')
          .select('case_id, allocated_amount')
          .in('case_id', caseIds);

        if (paymentsError) throw paymentsError;
        allPayments = allPaymentsData || [];
      }

      // Process cases with payment info (same logic as AdminDoctorDetailsPage)
      const casesWithPaymentInfo = (casesData || []).map((case_) => {
        const paymentInfo = calculateCasePaymentInfo(case_, allPayments);

        return {
          ...case_,
          ...paymentInfo, // This adds: remainingAmount, paymentStatus, totalPaid, paymentPercentage
          // Format for table display
          case_id: `CASE-${case_.id}`,
          patient_name:
            `${case_.first_name || ''} ${case_.last_name || ''}`.trim() ||
            'Unknown Patient',
          case_date: case_.created_at,
          amount: parseFloat(case_.approved_total_cost || 0),
          treatment_type: `${case_.aligner_material || 'Standard'} - ${
            case_.treatment_arch
              ? case_.treatment_arch === 'both'
                ? 'both arches'
                : `${case_.treatment_arch} arch only`
              : 'Both Arches'
          }`,
          // Additional case details
          aligners_count: `${case_.upper_jaw_aligners || 0}U / ${
            case_.lower_jaw_aligners || 0
          }L`,
          duration: case_.estimated_duration_months
            ? `${case_.estimated_duration_months} months`
            : 'TBD',
          is_refinement: case_.refinement_number > 0,
          refinement_info:
            case_.refinement_number > 0
              ? `Refinement #${case_.refinement_number}`
              : null,
          urgency: case_.is_urgent ? 'Urgent' : 'Standard',
          // Cost breakdown
          case_study_fee: parseFloat(case_.case_study_fee || 0),
          aligners_price: parseFloat(case_.aligners_price || 0),
          delivery_charges: parseFloat(case_.delivery_charges || 0),
        };
      });

      // Calculate totals (what doctor owes/has paid)
      const totalCasesCount = casesWithPaymentInfo.length;
      const totalDueAmount = casesWithPaymentInfo.reduce(
        (sum, case_) => sum + case_.remainingAmount,
        0
      );
      const totalPaidAmount = casesWithPaymentInfo.reduce(
        (sum, case_) => sum + case_.totalPaid,
        0
      );

      // Count pending and completed cases
      const pendingCasesCount = casesWithPaymentInfo.filter(
        (case_) => case_.remainingAmount > 0
      ).length;
      const completedCasesCount = casesWithPaymentInfo.filter(
        (case_) => case_.remainingAmount === 0 && case_.totalPaid > 0
      ).length;

      setCases(casesWithPaymentInfo);
      setTotalCases(totalCasesCount);
      setTotalDue(totalDueAmount);
      setTotalPaid(totalPaidAmount);
      setPendingCases(pendingCasesCount);
      setCompletedCases(completedCasesCount);
    } catch (err) {
      console.error('Error fetching doctor billing data:', err);
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  return {
    cases,
    loading,
    error,
    totalCases,
    totalDue,
    totalPaid,
    pendingCases,
    completedCases,
    refetchBillingData: fetchBillingData,
  };
};
