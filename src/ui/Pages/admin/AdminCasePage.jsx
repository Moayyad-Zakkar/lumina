import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router';

import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Button } from '../../components/Button';
import { IconButton } from '../../components/IconButton';
import { Alert } from '../../components/Alert';
import { DataFieldHorizontal } from '../../components/DataFieldHorizontal';
import { Badge } from '../../components/Badge';
import { Table } from '../../components/Table';
import Error from '../../components/Error';
import CaseStatusBadge from '../../components/CaseStatusBadge';
import { TextField } from '../../components/TextField';

import {
  FeatherBell,
  FeatherBox,
  FeatherCalendar,
  FeatherCheck,
  FeatherClock,
  FeatherDollarSign,
  FeatherDownload,
  FeatherGrid,
  FeatherPlusCircle,
  FeatherPrinter,
  FeatherTag,
  FeatherUser,
  FeatherX,
  FeatherEdit2,
  FeatherAlertTriangle,
  FeatherPhone,
  FeatherHospital,
  FeatherRefreshCw,
  FeatherFileText,
  FeatherEdit3,
  FeatherSave,
  FeatherRotateCcw,
  FeatherTruck,
} from '@subframe/core';

import supabase from '../../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import { Dialog } from '../../components/Dialog';
import toast from 'react-hot-toast';
import { downloadFile } from '../../../helper/storageUtils';
import DentalChart from '../../components/DentalChart';
import DeclineCaseDialog from '../../components/DeclineCaseDialog';

const AdminCasePage = () => {
  const { caseData, error } = useLoaderData();
  const navigate = useNavigate();

  const [currentStatus, setCurrentStatus] = useState(caseData?.status);
  const [upperJawAligners, setUpperJawAligners] = useState(
    caseData?.upper_jaw_aligners ?? ''
  );
  const [lowerJawAligners, setLowerJawAligners] = useState(
    caseData?.lower_jaw_aligners ?? ''
  );
  const [estimatedDurationMonths, setEstimatedDurationMonths] = useState(
    caseData?.estimated_duration_months ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [isEditingPlan, setIsEditingPlan] = useState(
    caseData?.status === 'submitted'
  );
  const [editBackup, setEditBackup] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const [downloadingFiles, setDownloadingFiles] = useState(false);

  const [showDeclineDialog, setShowDeclineDialog] = useState(false);
  const [isDecliningCase, setIsDecliningCase] = useState(false);

  // Prices and fees
  const [caseStudyFee, setCaseStudyFee] = useState('0.00');
  const [alignerUnitPrice, setAlignerUnitPrice] = useState(0); // just the unit price from DB
  const [alignersPrice, setAlignersPrice] = useState('0.00');
  const [deliveryCharges, setDeliveryCharges] = useState('25.00');

  // Add undo decline state
  const [isUndoingDecline, setIsUndoingDecline] = useState(false);

  const isDisabled = useMemo(() => saving, [saving]);

  const isPlanEditAllowed = useMemo(
    () =>
      !['ready_for_delivery', 'delivered', 'completed'].includes(currentStatus),
    [currentStatus]
  );

  /* Admin Note Logic */
  const [adminNote, setAdminNote] = useState(caseData?.admin_note || '');
  const [isEditingAdminNote, setIsEditingAdminNote] = useState(false);
  const [adminNoteBackup, setAdminNoteBackup] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState(null);

  const handleEditAdminNote = () => {
    setAdminNoteBackup(adminNote);
    setIsEditingAdminNote(true);
  };

  const handleCancelEditAdminNote = () => {
    setAdminNote(adminNoteBackup);
    setIsEditingAdminNote(false);
    setNoteError(null);
  };

  const handleSaveAdminNote = async () => {
    try {
      setSavingNote(true);
      setNoteError(null);
      const { error } = await supabase
        .from('cases')
        .update({ admin_note: adminNote })
        .eq('id', caseData.id);
      if (error) throw error;
      toast.success('Admin note saved');
      setIsEditingAdminNote(false);
    } catch (err) {
      setNoteError(err.message || 'Failed to save note');
      toast.error(err.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  /* Pricing Logic */
  useEffect(() => {
    const fetchDefaults = async () => {
      // 1. Case Study Fee
      const { data: feeData } = await supabase
        .from('services')
        .select('price')
        .eq('type', 'acceptance_fee')
        .eq('is_active', true)
        .single();

      setCaseStudyFee(feeData?.price?.toFixed(2) || '0.00');

      // 2. Aligner Material Price
      const { data: materialData } = await supabase
        .from('services')
        .select('price')
        .eq('type', 'aligners_material')
        .eq('name', caseData?.aligner_material) // pass this prop or fetch once
        .eq('is_active', true)
        .single();

      setAlignerUnitPrice(parseFloat(materialData?.price || 0));
    };

    fetchDefaults();
  }, [caseData?.aligner_material]);

  useEffect(() => {
    const totalAligners =
      parseInt(upperJawAligners || 0) + parseInt(lowerJawAligners || 0);
    const totalPrice = totalAligners * alignerUnitPrice;
    setAlignersPrice(totalPrice.toFixed(2));
  }, [upperJawAligners, lowerJawAligners, alignerUnitPrice]);

  /* Storage Logic */

  const openSignedFromStoredUrl = async (storedUrl) => {
    const result = await downloadFile(storedUrl);
    if (!result.success) {
      console.error('Download failed:', result.error);
    }
  };

  useEffect(() => {
    if (!isPlanEditAllowed && isEditingPlan) {
      setIsEditingPlan(false);
      setEditBackup(null);
    }
  }, [isPlanEditAllowed, isEditingPlan]);

  // Mark admin notifications for this case as read when page opens
  useEffect(() => {
    const markNotificationsRead = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || !caseData?.id) return;
        await supabase
          .from('notifications')
          .update({ status: 'read' })
          .eq('recipient_id', user.id)
          .eq('case_id', caseData.id)
          .eq('status', 'unread');
      } catch {
        // ignore
      }
    };
    markNotificationsRead();
  }, [caseData?.id]);

  const alertContent = useMemo(() => {
    switch (currentStatus) {
      case 'rejected':
        return {
          title: 'Case has been declined',
          description:
            'This case was declined and is no longer active. You can undo this action if needed.',
          variant: 'destructive',
        };
      case 'approved':
        return {
          title: 'Doctor approved the treatment plan',
          description:
            'Proceed with manufacturing. Update the case status as production progresses.',
        };
      case 'in_production':
        return {
          title: 'Aligners are in production',
          description:
            'Update to Ready for Delivery when manufacturing is complete.',
        };
      case 'ready_for_delivery':
        return {
          title: 'Aligners are ready for delivery',
          description:
            'Mark as Delivered once the clinic receives their aligners.',
        };
      case 'delivered':
        return {
          title: 'Aligners delivered to clinic',
          description: 'Mark the case as Completed when treatment concludes.',
        };
      case 'completed':
        return {
          title: 'The case is complete',
          description: 'The doctor had finished the case',
        };
      default:
        return {
          title: 'Review the case and provide plan details',
          description:
            'Set aligners count and duration, then send to doctor for approval or decline the case.',
        };
    }
  }, [currentStatus]);

  if (error) {
    return <Error error={error} />;
  }
  if (!caseData) {
    return <p className="text-neutral-500">Case not found.</p>;
  }

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
      // Optionally refresh the page data
      if (typeof updates.status === 'string') {
        setCurrentStatus(updates.status);
      }
    } catch (e) {
      setActionError(null);
      toast.error(e.message || 'Failed to update case');
    } finally {
      setSaving(false);
    }
  };

  const handleSendForApproval = async () => {
    // Basic validation for numeric fields
    const u = Number(upperJawAligners);
    const l = Number(lowerJawAligners);
    const d = Number(estimatedDurationMonths);
    if (
      Number.isNaN(u) ||
      Number.isNaN(l) ||
      Number.isNaN(d) ||
      u <= 0 ||
      l <= 0 ||
      d <= 0
    ) {
      setActionError(null);
      toast.error('Please enter valid positive numbers for all fields');
      return;
    }
    await updateCase({
      upper_jaw_aligners: u,
      lower_jaw_aligners: l,
      estimated_duration_months: d,
      status: 'awaiting_user_approval',
    });
    setIsEditingPlan(false);
    setEditBackup(null);
    toast.success('Sent for doctor approval');
  };

  const handleStatusTransition = async (newStatus) => {
    await updateCase({ status: newStatus });
  };

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

  const handleDeleteCase = async () => {
    try {
      setSaving(true);
      setActionError(null);
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseData.id);
      if (deleteError) throw deleteError;
      setIsDeleteDialogOpen(false);
      navigate('/admin/cases');
    } catch (e) {
      setActionError(null);
      toast.error(e.message || 'Failed to delete case');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAllFiles = async () => {
    setDownloadingFiles(true);
    try {
      const filesToDownload = [];

      // Collect all available file URLs
      if (caseData.upper_jaw_scan_url) {
        filesToDownload.push({
          url: caseData.upper_jaw_scan_url,
          name: `Case-${caseData.id}-Upper-Jaw-Scan`,
        });
      }
      if (caseData.lower_jaw_scan_url) {
        filesToDownload.push({
          url: caseData.lower_jaw_scan_url,
          name: `Case-${caseData.id}-Lower-Jaw-Scan`,
        });
      }
      if (caseData.bite_scan_url) {
        filesToDownload.push({
          url: caseData.bite_scan_url,
          name: `Case-${caseData.id}-Bite-Scan`,
        });
      }
      if (
        caseData.additional_files_urls &&
        caseData.additional_files_urls.length > 0
      ) {
        caseData.additional_files_urls.forEach((url, index) => {
          filesToDownload.push({
            url: url,
            name: `Case-${caseData.id}-Additional-File-${index + 1}`,
          });
        });
      }

      if (filesToDownload.length === 0) {
        toast.error('No files available to download');
        return;
      }

      // Download each file
      let successCount = 0;
      let failCount = 0;

      for (const file of filesToDownload) {
        try {
          const result = await downloadFile(file.url);
          if (result.success) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to download ${file.name}:`, result.error);
          }
        } catch (error) {
          failCount++;
          console.error(`Error downloading ${file.name}:`, error);
        }
      }

      if (successCount > 0) {
        toast.success(
          `Successfully downloaded ${successCount} file(s)${
            failCount > 0 ? `, ${failCount} failed` : ''
          }`
        );
      } else {
        toast.error('Failed to download files');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download files');
    } finally {
      setDownloadingFiles(false);
    }
  };

  /*
Decline Reason Dialog
*/

  // Update your handleDecline function
  const handleDecline = () => {
    setShowDeclineDialog(true);
  };

  // Add this new function to handle the actual decline with reason
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
        })
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      setCurrentStatus('rejected');
      // Update local case data to reflect the decline
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

  // Add this function to handle dialog close
  const handleCloseDeclineDialog = () => {
    setShowDeclineDialog(false);
  };

  // Add undo decline functionality
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
      // Clear local decline data
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

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <Breadcrumbs>
          <Link to="/admin/cases">
            <Breadcrumbs.Item>Cases</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>Case Details</Breadcrumbs.Item>
        </Breadcrumbs>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-heading-2 font-heading-2 text-default-font">
              Case-{caseData.id}
            </span>
            <CaseStatusBadge status={currentStatus} />
            {caseData.parent_case_id && (
              <Badge variant="brand" icon={<FeatherRefreshCw />}>
                Refinement #{caseData.refinement_number || 1}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {caseData.parent_case_id && (
              <Button
                variant="neutral-secondary"
                icon={<FeatherRefreshCw />}
                asChild
              >
                <Link to={`/admin/cases/${caseData.parent_case_id}`}>
                  View Original Case
                </Link>
              </Button>
            )}
            {/*
            {currentStatus === 'rejected' && (
              <Button
                variant="brand-secondary"
                icon={<FeatherRotateCcw />}
                onClick={handleUndoDecline}
                disabled={isUndoingDecline}
              >
                {isUndoingDecline ? 'Undoing...' : 'Undo Decline'}
              </Button>
            )}*/}
            <Button
              variant="neutral-secondary"
              icon={<FeatherDownload />}
              onClick={handleDownloadAllFiles}
              disabled={downloadingFiles}
            >
              {downloadingFiles ? 'Downloading...' : 'Download Files'}
            </Button>
          </div>
        </div>
      </div>

      {isDeleteDialogOpen && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <Dialog.Content className="p-6 max-w-[480px]">
            <div className="flex items-start gap-3">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Delete Case
              </span>
            </div>
            <div className="mt-2 text-body font-body text-subtext-color">
              This action cannot be undone. Are you sure you want to permanently
              delete this case?
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="neutral-secondary"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive-primary"
                onClick={handleDeleteCase}
                disabled={saving}
                icon={<FeatherAlertTriangle />}
              >
                Delete
              </Button>
            </div>
          </Dialog.Content>
        </Dialog>
      )}

      {/* Show decline reason alert for rejected cases */}
      {currentStatus === 'rejected' && caseData.decline_reason && (
        <Alert
          variant="destructive"
          icon={<FeatherAlertTriangle />}
          title="Case Declined"
          description={
            <div className="space-y-2">
              <p>
                <strong>Reason:</strong> {caseData.decline_reason}
              </p>
              {caseData.declined_at && (
                <p className="text-sm opacity-75">
                  Declined on{' '}
                  {new Date(caseData.declined_at).toLocaleDateString()} at{' '}
                  {new Date(caseData.declined_at).toLocaleTimeString()}
                </p>
              )}
            </div>
          }
          actions={
            <Button
              variant="destructive-secondary"
              size="small"
              icon={<FeatherRotateCcw />}
              onClick={handleUndoDecline}
              disabled={isUndoingDecline}
            >
              {isUndoingDecline ? 'Undoing...' : 'Undo Decline'}
            </Button>
          }
        />
      )}

      {/* Standard status alert for non-rejected cases */}
      {currentStatus !== 'rejected' && (
        <Alert
          variant={alertContent.variant || 'brand'}
          icon={<FeatherBell />}
          title={alertContent.title}
          description={alertContent.description}
          actions={null}
        />
      )}

      {actionError && <Error error={actionError} />}
      {actionSuccess && (
        <div className="rounded-md border border-solid border-success-200 bg-success-50 p-4 text-success-700">
          {actionSuccess}
        </div>
      )}

      <div className="flex w-full flex-col items-start gap-6">
        <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Case Information
          </span>
          <div className="flex w-full flex-wrap items-start gap-6">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
              <DataFieldHorizontal icon={<FeatherUser />} label="First Name">
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {capitalizeFirstSafe(caseData.first_name) || 'N/A'}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal icon={<FeatherUser />} label="Last Name">
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {capitalizeFirstSafe(caseData.last_name) || 'N/A'}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal
                icon={<FeatherUser />}
                label={"Doctor's Name"}
              >
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {capitalizeFirstSafe(caseData.profiles?.full_name) || 'N/A'}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal icon={<FeatherPhone />} label="Phone">
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {caseData.profiles?.phone || 'N/A'}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal
                icon={<FeatherCalendar />}
                label="Submission Date"
              >
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {caseData.created_at
                    ? new Date(caseData.created_at).toLocaleDateString()
                    : 'N/A'}
                </span>
              </DataFieldHorizontal>
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
              <DataFieldHorizontal icon={<FeatherTag />} label="Case ID">
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  CASE-{caseData.id}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal icon={<FeatherHospital />} label="Clinic">
                <span className="whitespace-nowrap text-body font-body text-default-font">
                  {caseData.profiles?.clinic || 'N/A'}
                </span>
              </DataFieldHorizontal>
              <DataFieldHorizontal
                icon={<FeatherBox />}
                label="Aligner Material"
              >
                <Badge>{caseData.aligner_material || 'Not specified'}</Badge>
              </DataFieldHorizontal>
              {/*<DataFieldHorizontal
                icon={<FeatherPrinter />}
                label="Printing Method"
              >
                <Badge>{caseData.printing_method || 'Not specified'}</Badge>
              </DataFieldHorizontal>*/}
              {caseData.refinement_reason && (
                <DataFieldHorizontal
                  icon={<FeatherRefreshCw />}
                  label="Refinement Reason"
                >
                  <span className="text-body font-body text-default-font">
                    {caseData.refinement_reason}
                  </span>
                </DataFieldHorizontal>
              )}
            </div>
          </div>
        </div>

        {caseData.user_note && (
          <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
            <div className="flex items-center gap-2">
              <FeatherFileText className="h-5 w-5 text-neutral-600" />
              <span className="text-heading-3 font-heading-3 text-default-font">
                Doctor Notes
              </span>
            </div>
            <div className="w-full p-4 rounded-md bg-neutral-50 border border-neutral-200">
              <p className="text-body font-body text-default-font whitespace-pre-wrap">
                {caseData.user_note}
              </p>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Dental Chart
          </span>
          <div>
            <DentalChart
              initialStatus={caseData.tooth_status || {}}
              onChange={(updated) =>
                supabase
                  .from('cases')
                  .update({ tooth_status: updated })
                  .eq('id', caseData.id)
              }
              readOnly={true}
            />
          </div>
        </div>

        <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Treatment Plan Review
          </span>
          <div className="flex w-full flex-col items-start gap-6">
            <div className="flex w-full flex-wrap items-start gap-6">
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
                {isEditingPlan ? (
                  <>
                    <div className="flex items-center gap-2 text-caption-bold font-caption-bold text-default-font">
                      Aligner Material:
                      <Badge>
                        {caseData.aligner_material} ({alignerUnitPrice}$)
                      </Badge>
                    </div>

                    <TextField label="Upper Jaw Aligners">
                      <TextField.Input
                        type="number"
                        min={1}
                        value={upperJawAligners}
                        onChange={(e) => setUpperJawAligners(e.target.value)}
                      />
                    </TextField>
                    <TextField label="Lower Jaw Aligners">
                      <TextField.Input
                        type="number"
                        min={1}
                        value={lowerJawAligners}
                        onChange={(e) => setLowerJawAligners(e.target.value)}
                      />
                    </TextField>
                    <TextField label="Estimated Duration (months)">
                      <TextField.Input
                        type="number"
                        min={1}
                        value={estimatedDurationMonths}
                        onChange={(e) =>
                          setEstimatedDurationMonths(e.target.value)
                        }
                      />
                    </TextField>
                  </>
                ) : (
                  <>
                    <DataFieldHorizontal
                      icon={<FeatherGrid />}
                      label="Upper Jaw Aligners"
                    >
                      <Badge>{upperJawAligners || '—'} Aligners</Badge>
                    </DataFieldHorizontal>
                    <DataFieldHorizontal
                      icon={<FeatherGrid />}
                      label="Lower Jaw Aligners"
                    >
                      <Badge>{lowerJawAligners || '—'} Aligners</Badge>
                    </DataFieldHorizontal>
                    <DataFieldHorizontal
                      icon={<FeatherClock />}
                      label="Estimated Duration"
                    >
                      <span className="whitespace-nowrap text-body font-body text-default-font">
                        {estimatedDurationMonths || '—'} Months
                      </span>
                    </DataFieldHorizontal>
                  </>
                )}
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
                {isEditingPlan ? (
                  <>
                    <TextField label="Case Study Fee">
                      <TextField.Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={caseStudyFee}
                        onChange={(e) => setCaseStudyFee(e.target.value)}
                        placeholder="0.00"
                      />
                    </TextField>
                    <TextField label="Aligners Price">
                      <TextField.Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={alignersPrice}
                        onChange={(e) => setAlignersPrice(e.target.value)}
                        placeholder="0.00"
                      />
                    </TextField>
                    <TextField label="Delivery Charges">
                      <TextField.Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={deliveryCharges}
                        onChange={(e) => setDeliveryCharges(e.target.value)}
                        placeholder="0.00"
                      />
                    </TextField>
                    <DataFieldHorizontal
                      icon={<FeatherDollarSign />}
                      label="Total Cost"
                    >
                      <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                        $
                        {(
                          parseFloat(caseStudyFee || 0) +
                          parseFloat(alignersPrice || 0) +
                          parseFloat(deliveryCharges || 0)
                        ).toFixed(2)}
                      </span>
                    </DataFieldHorizontal>
                  </>
                ) : (
                  <>
                    <DataFieldHorizontal
                      icon={<FeatherFileText />}
                      label="Case Study Fee"
                    >
                      <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                        ${parseFloat(caseStudyFee || 0).toFixed(2)}
                      </span>
                    </DataFieldHorizontal>
                    <DataFieldHorizontal
                      icon={<FeatherGrid />}
                      label="Aligners Price"
                    >
                      <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                        ${parseFloat(alignersPrice || 0).toFixed(2)}
                      </span>
                    </DataFieldHorizontal>
                    <DataFieldHorizontal
                      icon={<FeatherTruck />}
                      label="Delivery Charges"
                    >
                      <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                        ${parseFloat(deliveryCharges || 0).toFixed(2)}
                      </span>
                    </DataFieldHorizontal>
                    <DataFieldHorizontal
                      icon={<FeatherDollarSign />}
                      label="Total Cost"
                    >
                      <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                        $
                        {(
                          parseFloat(caseStudyFee || 0) +
                          parseFloat(alignersPrice || 0) +
                          parseFloat(deliveryCharges || 0)
                        ).toFixed(2)}
                      </span>
                    </DataFieldHorizontal>
                  </>
                )}
              </div>
            </div>
            <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-border" />

            {/* Admin Note Section */}

            <div className="flex w-full items-center justify-between">
              <span className="text-heading-3 font-heading-3 text-default-font">
                3DA Notes
              </span>
              {!isEditingAdminNote && (
                <Button
                  variant="neutral-secondary"
                  size="small"
                  icon={<FeatherEdit3 />}
                  onClick={handleEditAdminNote}
                >
                  {adminNote ? 'Edit Note' : 'Add Note'}
                </Button>
              )}
            </div>

            {noteError && (
              <div className="w-full">
                <Error error={noteError} />
              </div>
            )}

            <div className="w-full">
              {isEditingAdminNote ? (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label
                      htmlFor="adminNoteTextarea"
                      className="text-body-bold font-body-bold text-default-font"
                    >
                      Additional Notes
                    </label>
                    <textarea
                      id="adminNoteTextarea"
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Enter any special instructions, internal comments, etc..."
                      rows={6}
                      className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[120px] placeholder:text-subtext-color"
                      disabled={savingNote}
                    />
                    <span className="text-caption font-caption text-subtext-color">
                      Add any additional information or internal notes about
                      this case.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      icon={<FeatherSave />}
                      onClick={handleSaveAdminNote}
                      disabled={savingNote}
                      size="small"
                    >
                      {savingNote ? 'Saving...' : 'Save Note'}
                    </Button>
                    <Button
                      variant="neutral-secondary"
                      onClick={handleCancelEditAdminNote}
                      disabled={savingNote}
                      size="small"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  {adminNote ? (
                    <div className="w-full bg-white border border-neutral-200 rounded-md p-4 shadow-sm">
                      <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                        {adminNote}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-neutral-50 text-sm text-neutral-500 rounded-md p-3">
                      No lab notes added yet.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-border" />
            <div className="flex w-full items-center justify-between">
              <span className="text-body font-body text-subtext-color">
                {isEditingPlan
                  ? 'Choose to decline the case or set plan details and send to the doctor for approval.'
                  : currentStatus === 'awaiting_user_approval'
                  ? 'Plan details are awaiting doctor approval.'
                  : currentStatus === 'approved'
                  ? 'Plan approved by doctor. Proceed with manufacturing.'
                  : currentStatus === 'rejected'
                  ? 'Case has been declined and is inactive.'
                  : currentStatus === 'in_production'
                  ? 'Manufacturing in progress.'
                  : currentStatus === 'ready_for_delivery'
                  ? 'Ready for delivery to patient.'
                  : currentStatus === 'delivered'
                  ? 'Delivered to patient. Mark completed when treatment ends.'
                  : ''}
              </span>
              <div className="flex items-center gap-2">
                {isEditingPlan ? (
                  <>
                    <Button
                      variant="neutral-tertiary"
                      onClick={handleCancelEdit}
                      icon={<FeatherX />}
                    >
                      Cancel editing
                    </Button>
                    <Button
                      variant="destructive-secondary"
                      disabled={isDisabled}
                      onClick={handleDecline}
                    >
                      Decline Case
                    </Button>

                    <Button
                      icon={<FeatherCheck />}
                      disabled={isDisabled}
                      onClick={handleSendForApproval}
                    >
                      Send for Doctor Approval
                    </Button>
                  </>
                ) : isPlanEditAllowed && currentStatus !== 'rejected' ? (
                  <IconButton
                    icon={<FeatherEdit2 />}
                    onClick={handleStartEdit}
                    aria-label="Edit plan details"
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <DeclineCaseDialog
          isOpen={showDeclineDialog}
          onClose={handleCloseDeclineDialog}
          onConfirm={handleConfirmDecline}
          isLoading={isDecliningCase}
        />

        {/* Progress Update */}

        {(currentStatus === 'approved' ||
          currentStatus === 'in_production' ||
          currentStatus === 'ready_for_delivery' ||
          currentStatus === 'delivered' ||
          currentStatus === 'completed') && (
          <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Manufacturing Progress
            </span>
            <div className="flex w-full items-center justify-between">
              <span className="text-body font-body text-subtext-color">
                Update the case status as you progress through manufacturing and
                delivery.
              </span>
              <div className="flex items-center gap-2">
                {currentStatus === 'approved' && (
                  <Button
                    disabled={isDisabled}
                    onClick={() => handleStatusTransition('in_production')}
                  >
                    Start Production
                  </Button>
                )}
                {currentStatus === 'in_production' && (
                  <Button
                    disabled={isDisabled}
                    onClick={() => handleStatusTransition('ready_for_delivery')}
                  >
                    Mark Ready for Delivery
                  </Button>
                )}
                {currentStatus === 'ready_for_delivery' && (
                  <Button
                    disabled={isDisabled}
                    onClick={() => handleStatusTransition('delivered')}
                  >
                    Mark Delivered
                  </Button>
                )}
                {currentStatus === 'delivered' && (
                  <Button
                    disabled={isDisabled}
                    onClick={() => handleStatusTransition('completed')}
                  >
                    Complete Case
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Uploaded Files
          </span>
          <Table
            header={
              <Table.HeaderRow>
                <Table.HeaderCell>File Name</Table.HeaderCell>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>URL</Table.HeaderCell>
                <Table.HeaderCell>Actions</Table.HeaderCell>
              </Table.HeaderRow>
            }
          >
            {caseData.upper_jaw_scan_url && (
              <Table.Row>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    Upper Jaw Scan
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">Upper Jaw</Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseData.upper_jaw_scan_url ? 'Available' : 'Not uploaded'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {caseData.upper_jaw_scan_url && (
                    <IconButton
                      icon={<FeatherDownload />}
                      onClick={() =>
                        openSignedFromStoredUrl(caseData.upper_jaw_scan_url)
                      }
                    />
                  )}
                </Table.Cell>
              </Table.Row>
            )}
            {caseData.lower_jaw_scan_url && (
              <Table.Row>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    Lower Jaw Scan
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">Lower Jaw</Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseData.lower_jaw_scan_url ? 'Available' : 'Not uploaded'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {caseData.lower_jaw_scan_url && (
                    <IconButton
                      icon={<FeatherDownload />}
                      onClick={() =>
                        openSignedFromStoredUrl(caseData.lower_jaw_scan_url)
                      }
                    />
                  )}
                </Table.Cell>
              </Table.Row>
            )}
            {caseData.bite_scan_url && (
              <Table.Row>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    Bite Scan
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="neutral">Bite</Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    {caseData.bite_scan_url ? 'Available' : 'Not uploaded'}
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {caseData.bite_scan_url && (
                    <IconButton
                      icon={<FeatherDownload />}
                      onClick={() =>
                        openSignedFromStoredUrl(caseData.bite_scan_url)
                      }
                    />
                  )}
                </Table.Cell>
              </Table.Row>
            )}
            {caseData.additional_files_urls &&
              caseData.additional_files_urls.length > 0 &&
              caseData.additional_files_urls.map((fileUrl, index) => (
                <Table.Row key={index}>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                      Additional File {index + 1}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="neutral">Additional</Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      Available
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <IconButton
                      icon={<FeatherDownload />}
                      onClick={() => openSignedFromStoredUrl(fileUrl)}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            {!caseData.upper_jaw_scan_url &&
              !caseData.lower_jaw_scan_url &&
              !caseData.bite_scan_url &&
              (!caseData.additional_files_urls ||
                caseData.additional_files_urls.length === 0) && (
                <Table.Row>
                  <Table.Cell colSpan={4}>
                    <span className="text-neutral-500 py-4">
                      No files uploaded for this case.
                    </span>
                  </Table.Cell>
                </Table.Row>
              )}
          </Table>
        </div>
        <div className="flex w-full items-center justify-end">
          <Button
            variant="destructive-primary"
            icon={<FeatherAlertTriangle />}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="w-auto"
          >
            Delete Case
          </Button>
        </div>
      </div>
    </>
  );
};

export default AdminCasePage;
