import { useState, useEffect, useMemo } from 'react';
import supabase from '../helper/supabaseClient';
import toast from 'react-hot-toast';

export const useAdminCaseActions = (caseData) => {
  const [currentStatus, setCurrentStatus] = useState(caseData?.status);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);

  // Pricing state
  const [caseStudyFee, setCaseStudyFee] = useState(
    caseData?.case_study_fee?.toFixed(2) || '0.00'
  );
  const [alignerUnitPrice, setAlignerUnitPrice] = useState(0);
  const [alignersPrice, setAlignersPrice] = useState(
    caseData?.aligners_price?.toFixed(2) || '0.00'
  );
  const [deliveryCharges, setDeliveryCharges] = useState(
    caseData?.delivery_charges?.toFixed(2) || '25.00'
  );

  // Treatment plan editing state
  const [upperJawAligners, setUpperJawAligners] = useState(
    caseData?.upper_jaw_aligners ?? ''
  );
  const [lowerJawAligners, setLowerJawAligners] = useState(
    caseData?.lower_jaw_aligners ?? ''
  );
  const [estimatedDurationMonths, setEstimatedDurationMonths] = useState(
    caseData?.estimated_duration_months ?? ''
  );
  const [isEditingPlan, setIsEditingPlan] = useState(
    ['submitted', 'accepted'].includes(caseData?.status)
  );
  const [editBackup, setEditBackup] = useState(null);

  // Decline dialog state
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [isDecliningCase, setIsDecliningCase] = useState(false);
  const [isUndoingDecline, setIsUndoingDecline] = useState(false);

  const isDisabled = useMemo(() => saving, [saving]);

  const isPlanEditAllowed = useMemo(
    () =>
      ![
        'ready_for_delivery',
        'delivered',
        'completed',
        'user_rejected',
      ].includes(currentStatus),
    [currentStatus]
  );

  // Fetch pricing defaults
  useEffect(() => {
    const fetchDefaults = async () => {
      // Only fetch defaults if no existing pricing data
      const hasNoFeeRecord =
        caseData?.case_study_fee === undefined ||
        caseData?.case_study_fee === null;

      if (hasNoFeeRecord) {
        // 1. Case Study Fee
        const { data: feeData } = await supabase
          .from('services')
          .select('price')
          .eq('type', 'acceptance_fee')
          .eq('is_active', true)
          .single();

        setCaseStudyFee(feeData?.price?.toFixed(2) || '0.00');
      }

      // 2. Aligner Material Price (always fetch for calculation)
      const { data: materialData } = await supabase
        .from('services')
        .select('price')
        .eq('type', 'aligners_material')
        .eq('name', caseData?.aligner_material)
        .eq('is_active', true)
        .single();

      setAlignerUnitPrice(parseFloat(materialData?.price || 0));
    };

    fetchDefaults();
  }, [caseData?.aligner_material, caseData?.case_study_fee]);

  // Auto-calculate aligners price
  useEffect(() => {
    const totalAligners =
      parseInt(upperJawAligners || 0) + parseInt(lowerJawAligners || 0);
    const totalPrice = totalAligners * alignerUnitPrice;
    setAlignersPrice(totalPrice.toFixed(2));
  }, [upperJawAligners, lowerJawAligners, alignerUnitPrice]);

  // Update case in database
  const updateCase = async (updates) => {
    setSaving(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const { error: updateError } = await supabase
        .from('cases')
        .update(updates)
        .eq('id', caseData.id);

      if (updateError) throw updateError;
      setActionSuccess('Case updated successfully.');

      if (typeof updates.status === 'string') {
        setCurrentStatus(updates.status);
      }
    } catch (e) {
      setActionError(e.message || 'Failed to update case');
      toast.error(e.message || 'Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  // Accept case
  const acceptCase = async () => {
    const caseStudyFeeAmount = parseFloat(caseStudyFee || 0);
    await updateCase({
      status: 'accepted',
      case_study_fee: caseStudyFeeAmount,
      total_cost: caseStudyFeeAmount, // Update total cost when case study fee is set
      approved_total_cost: caseStudyFeeAmount,
    });
    toast.success('Case accepted successfully');
  };

  // Reject case by admin
  const handleDecline = () => {
    setShowDeclineDialog(true);
  };

  const handleConfirmDecline = async (reason) => {
    setIsDecliningCase(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'rejected',
          decline_reason: reason,
          declined_at: new Date().toISOString(),
          declined_by: user?.id,
          case_study_fee: 0,
          total_cost: 0,
          approved_total_cost: 0,
        })
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      setCurrentStatus('rejected');
      caseData.decline_reason = reason;
      caseData.declined_at = new Date().toISOString();
      caseData.declined_by = user?.id;

      setShowDeclineDialog(false);
      setIsEditingPlan(false);
      setEditBackup(null);
      toast.success('Case declined successfully');
    } catch (error) {
      console.error('Error declining case:', error);
      toast.error(error.message || 'Failed to decline case');
    } finally {
      setIsDecliningCase(false);
    }
  };

  const handleCloseDeclineDialog = () => {
    setShowDeclineDialog(false);
  };

  // Undo decline
  const handleUndoDecline = async () => {
    setIsUndoingDecline(true);
    try {
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'submitted',
          decline_reason: null,
          declined_at: null,
          declined_by: null,
        })
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      setCurrentStatus('submitted');
      setIsEditingPlan(true);
      caseData.decline_reason = null;
      caseData.declined_at = null;
      caseData.declined_by = null;

      toast.success('Case decline has been undone');
    } catch (error) {
      console.error('Error undoing decline:', error);
      toast.error(error.message || 'Failed to undo decline');
    } finally {
      setIsUndoingDecline(false);
    }
  };

  // Send for approval
  const handleSendForApproval = async () => {
    const u = Number(upperJawAligners);
    const l = Number(lowerJawAligners);
    const d = Number(estimatedDurationMonths);

    if (
      Number.isNaN(u) ||
      Number.isNaN(l) ||
      Number.isNaN(d) ||
      u < 0 ||
      l < 0 ||
      d <= 0
    ) {
      setActionError('Please enter valid positive numbers for all fields');
      toast.error('Please enter valid positive numbers for all fields');
      return;
    }

    // Calculate total cost by adding aligners price and delivery charges to existing case study fee
    const existingCaseStudyFee = parseFloat(caseStudyFee || 0);
    const newAlignersPrice = parseFloat(alignersPrice || 0);
    const newDeliveryCharges = parseFloat(deliveryCharges || 0);
    const totalCost =
      existingCaseStudyFee + newAlignersPrice + newDeliveryCharges;

    await updateCase({
      upper_jaw_aligners: u,
      lower_jaw_aligners: l,
      estimated_duration_months: d,
      status: 'awaiting_user_approval',
      // Don't update case_study_fee here - it was already set during acceptance
      aligners_price: newAlignersPrice,
      delivery_charges: newDeliveryCharges,
      total_cost: totalCost,
      //// Don't update approved_total_cost here - it will be set when doctor approves
    });
    setIsEditingPlan(false);
    setEditBackup(null);
    toast.success('Sent for doctor approval');
  };

  // Status transitions
  const handleStatusTransition = async (newStatus) => {
    await updateCase({ status: newStatus });
  };

  // Edit plan functions
  const handleStartEdit = () => {
    if (!isPlanEditAllowed) return;
    setEditBackup({
      upper: upperJawAligners,
      lower: lowerJawAligners,
      duration: estimatedDurationMonths,
    });
    setIsEditingPlan(true);
  };

  const handleCancelEdit = () => {
    if (editBackup) {
      setUpperJawAligners(editBackup.upper);
      setLowerJawAligners(editBackup.lower);
      setEstimatedDurationMonths(editBackup.duration);
    }
    setIsEditingPlan(false);
    setEditBackup(null);
    setActionError(null);
  };

  return {
    // State
    currentStatus,
    saving,
    actionError,
    actionSuccess,
    caseStudyFee,
    setCaseStudyFee,
    alignerUnitPrice,
    alignersPrice,
    setAlignersPrice,
    deliveryCharges,
    setDeliveryCharges,
    upperJawAligners,
    setUpperJawAligners,
    lowerJawAligners,
    setLowerJawAligners,
    estimatedDurationMonths,
    setEstimatedDurationMonths,
    isEditingPlan,
    editBackup,
    showDeclineDialog,
    isDecliningCase,
    isUndoingDecline,
    isDisabled,
    isPlanEditAllowed,

    // Actions
    acceptCase,
    handleDecline,
    handleConfirmDecline,
    handleCloseDeclineDialog,
    handleUndoDecline,
    handleSendForApproval,
    handleStatusTransition,
    handleStartEdit,
    handleCancelEdit,
    updateCase,
  };
};
