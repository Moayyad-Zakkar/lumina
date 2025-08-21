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
} from '@subframe/core';

import supabase from '../../../helper/supabaseClient';
import { capitalizeFirstSafe } from '../../../helper/formatText';
import { Dialog } from '../../components/Dialog';
import toast from 'react-hot-toast';
import AdminRefinementManager from '../../components/AdminRefinementManager';
import {
  downloadFileFromStorage,
  initializeStorage,
} from '../../../helper/storageUtils';

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

  const isDisabled = useMemo(() => saving, [saving]);

  const isPlanEditAllowed = useMemo(
    () =>
      !['ready_for_delivery', 'delivered', 'completed'].includes(currentStatus),
    [currentStatus]
  );

  // Initialize storage on component mount
  useEffect(() => {
    initializeStorage();
  }, []);

  const openSignedFromStoredUrl = async (storedUrl) => {
    const result = await downloadFileFromStorage(storedUrl);
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

  const handleDecline = async () => {
    await updateCase({ status: 'rejected' });
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

  /*

status = ANY (ARRAY['submitted'::text,
 'under_review'::text,
  'rejected'::text,
   'awaiting_user_approval'::text,
    'user_rejected'::text, 'approved'::text,
     'in_production'::text, 'ready_for_delivery'::text,
      'delivered'::text, 
      'completed'::text])


*/

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
            <Button
              variant="neutral-secondary"
              icon={<FeatherDownload />}
              onClick={() => {
                // No-op; add bulk download if needed
              }}
            >
              Download Files
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

      <Alert
        variant="brand"
        icon={<FeatherBell />}
        title={alertContent.title}
        description={alertContent.description}
        actions={null}
      />

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
              <DataFieldHorizontal
                icon={<FeatherPrinter />}
                label="Printing Method"
              >
                <Badge>{caseData.printing_method || 'Not specified'}</Badge>
              </DataFieldHorizontal>
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

        <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Treatment Plan Review
          </span>
          <div className="flex w-full flex-col items-start gap-6">
            <div className="flex w-full flex-wrap items-start gap-6">
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
                {isEditingPlan ? (
                  <>
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
                      label="Estimated Duration (months)"
                    >
                      <span className="whitespace-nowrap text-body font-body text-default-font">
                        {estimatedDurationMonths || '—'} Months
                      </span>
                    </DataFieldHorizontal>
                  </>
                )}
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
                <DataFieldHorizontal
                  icon={<FeatherDollarSign />}
                  label="Base Price"
                >
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                    $—
                  </span>
                </DataFieldHorizontal>
                <DataFieldHorizontal
                  icon={<FeatherPlusCircle />}
                  label="Additional Charges"
                >
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-default-font">
                    $—
                  </span>
                </DataFieldHorizontal>
                <DataFieldHorizontal icon={<FeatherClock />} label="Total Cost">
                  <span className="whitespace-nowrap text-heading-3 font-heading-3 text-brand-600">
                    $—
                  </span>
                </DataFieldHorizontal>
              </div>
            </div>
            <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-border" />
            <div className="flex w-full items-center justify-between">
              <span className="text-body font-body text-subtext-color">
                {isEditingPlan
                  ? 'After setting plan details, choose to decline or send to doctor for approval.'
                  : currentStatus === 'awaiting_user_approval'
                  ? 'Plan details are awaiting doctor approval.'
                  : currentStatus === 'approved'
                  ? 'Plan approved by doctor. Proceed with manufacturing.'
                  : currentStatus === 'in_production'
                  ? 'Manufacturing in progress.'
                  : currentStatus === 'ready_for_delivery'
                  ? 'Ready for delivery to patient.'
                  : currentStatus === 'delivered'
                  ? 'Delivered to patient. Mark completed when treatment ends.'
                  : '—'}
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
                ) : isPlanEditAllowed ? (
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

        {/*<AdminRefinementManager caseId={caseData.id} />*/}

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
