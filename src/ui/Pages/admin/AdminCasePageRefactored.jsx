import React, { useEffect, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router';
import { Breadcrumbs } from '../../components/Breadcrumbs';
import { Button } from '../../components/Button';
import { Alert } from '../../components/Alert';
import { Badge } from '../../components/Badge';
import Error from '../../components/Error';
import CaseStatusBadge from '../../components/CaseStatusBadge';
import { Dialog } from '../../components/Dialog';
import toast from 'react-hot-toast';
import DentalChart from '../../components/DentalChart';
import DeclineCaseDialog from '../../components/AdminDeclineCaseDialog';

// Import refactored components
import CaseInformation from '../../components/case/CaseInformation';
import CaseNotes from '../../components/case/CaseNotes';
import FileDownloadTable from '../../components/case/FileDownloadTable';
import CaseAcceptanceCard from '../../components/case/CaseAcceptanceCard';
import AdminTreatmentPlanEditor from '../../components/case/AdminTreatmentPlanEditor';
import ManufacturingProgress from '../../components/case/ManufacturingProgress';
import AdminNotesSection from '../../components/case/AdminNotesSection';

// Import custom hooks
import { useFileDownload } from '../../../hooks/useFileDownload';
import { useCaseNotes } from '../../../hooks/useCaseNotes';
import { useAdminCaseActions } from '../../../hooks/useAdminCaseActions';

import {
  FeatherBell,
  FeatherDownload,
  FeatherRefreshCw,
  FeatherAlertTriangle,
  FeatherRotateCcw,
  FeatherEye,
  FeatherCheck,
} from '@subframe/core';

import supabase from '../../../helper/supabaseClient';
import { checkCaseTreatmentImages } from '../../../helper/caseHasView';

const AdminCasePageRefactored = () => {
  const { caseData, error } = useLoaderData();
  const navigate = useNavigate();
  const [caseHasViewer, setCaseHasViewer] = useState(false);

  // Initialize IPR data from caseData - this is the key fix!
  const [iprData, setIprData] = useState(caseData?.ipr_data || {});

  // Custom hooks
  const { downloadingFiles, downloadSingleFile, downloadAllFiles } =
    useFileDownload();
  const {
    isEditingNote,
    noteText,
    setNoteText,
    noteSaving,
    noteError,
    handleEditNote,
    handleCancelEditNote,
    handleSaveNote,
  } = useCaseNotes(caseData);

  const {
    currentStatus,
    saving,
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
    showDeclineDialog,
    isDecliningCase,
    isUndoingDecline,
    isDisabled,
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
  } = useAdminCaseActions(caseData);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Update iprData when caseData changes (important for when data is refetched)
  useEffect(() => {
    if (caseData?.ipr_data) {
      setIprData(caseData.ipr_data);
    }
  }, [caseData?.ipr_data]);

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

  // Check if the case has treatment sequence viewer available or not
  useEffect(() => {
    const checkImages = async () => {
      try {
        const { hasImages } = await checkCaseTreatmentImages(caseData.id);
        setCaseHasViewer(hasImages);
      } catch (error) {
        setCaseHasViewer(false);
      }
    };

    if (caseData.id) {
      checkImages();
    }
  }, [caseData.id]);

  const alertContent = {
    submitted: {
      title: 'Review and Accept/Decline Case',
      description:
        'Review the submitted case and decide whether to accept or decline it.',
    },
    accepted: {
      title: 'Case accepted - Create treatment plan',
      description:
        'Set aligners count and duration, then send to doctor for approval.',
    },
    awaiting_user_approval: {
      title: 'Treatment plan is sent to doctor for approval',
      description:
        'Waiting for the doctor approval to proceed with the production process.',
    },
    approved: {
      title: 'Doctor approved the treatment plan',
      description:
        'Proceed with manufacturing. Update the case status as production progresses.',
    },
    in_production: {
      title: 'Aligners are in production',
      description:
        'Update to Ready for Delivery when manufacturing is complete.',
    },
    ready_for_delivery: {
      title: 'Aligners are ready for delivery',
      description: 'Mark as Delivered once the clinic receives their aligners.',
    },
    delivered: {
      title: 'Aligners delivered to clinic',
      description: 'Mark the case as Completed when treatment concludes.',
    },
    completed: {
      title: 'The case is complete',
      description: 'The doctor had finished the case',
    },
    rejected: {
      title: 'Case has been declined',
      description:
        'This case was declined and is no longer active. You can undo this action if needed.',
      variant: 'destructive',
    },
    user_rejected: {
      title: 'Treatment plan was declined',
      description:
        "This case's Treatment plan was declined by the doctor and the case is no longer active.",
      variant: 'destructive',
    },
  };

  if (error) {
    return <Error error={error} />;
  }
  if (!caseData) {
    return <p className="text-neutral-500">Case not found.</p>;
  }

  const handleDeleteCase = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseData.id);
      if (deleteError) throw deleteError;
      setIsDeleteDialogOpen(false);
      navigate('/admin/cases');
    } catch (e) {
      toast.error(e.message || 'Failed to delete case');
    }
  };

  const currentAlert = alertContent[currentStatus] || alertContent.submitted;

  const handleViewerClick = () => {
    // Open the viewer in a new tab with the case ID
    const viewerUrl = `/case-viewer/${caseData.id}`;
    window.open(viewerUrl, '_blank');
  };

  const viewerLink = `${window.location.origin}/case-viewer/${caseData.id}`;

  const handleIPRSave = async (data) => {
    try {
      const { error } = await supabase
        .from('cases')
        .update({ ipr_data: data })
        .eq('id', caseData.id);

      if (error) throw error;

      // Update local state immediately
      setIprData(data);

      // Also update the caseData object so it persists
      caseData.ipr_data = data;

      toast.success('IPR data saved successfully');
    } catch (error) {
      console.error('Error saving IPR data:', error);
      toast.error('Failed to save IPR data');
    }
  };

  const approvePlan = async () => {
    try {
      await updateCase({ status: 'approved' });
      toast.success('Plan approved successfully');
    } catch (e) {
      toast.error(e.message || 'Failed to approve plan');
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
            <Button
              variant="neutral-secondary"
              icon={<FeatherDownload />}
              onClick={() => downloadAllFiles(caseData)}
              disabled={downloadingFiles.size > 0}
            >
              {downloadingFiles.size > 0 ? 'Downloading...' : 'Download Files'}
            </Button>
            {caseHasViewer && (
              <Button onClick={handleViewerClick} icon={<FeatherEye />}>
                Open 3DA Viewer
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
      {currentStatus !== 'rejected' && currentStatus !== 'user_rejected' && (
        <Alert
          variant={currentAlert.variant || 'brand'}
          icon={<FeatherBell />}
          title={currentAlert.title}
          description={currentAlert.description}
          actions={null}
        />
      )}

      {/* User rejected alert */}
      {currentStatus === 'user_rejected' && (
        <Alert
          variant="destructive"
          icon={<FeatherAlertTriangle />}
          title={currentAlert.title}
          description={currentAlert.description}
          actions={null}
        />
      )}

      <div className="flex w-full flex-col items-start gap-6">
        <CaseInformation caseData={caseData} isAdmin={true} />

        {/* Decline Reason Section */}
        {(currentStatus === 'user_rejected' || currentStatus === 'rejected') &&
          caseData.decline_reason && (
            <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-red-200 bg-red-50 px-6 pt-4 pb-6 shadow-sm">
              <div className="flex items-center gap-2">
                <FeatherAlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-heading-3 font-heading-3 text-red-900">
                  {currentStatus === 'user_rejected'
                    ? 'Doctor Decline Reason'
                    : 'Admin Decline Reason'}
                </span>
              </div>
              <div className="w-full bg-white border border-red-200 rounded-md p-4 shadow-sm">
                <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                  {caseData.decline_reason}
                </div>
              </div>
              {caseData.declined_at && (
                <div className="text-caption font-caption text-red-700">
                  Declined on{' '}
                  {new Date(caseData.declined_at).toLocaleDateString()} at{' '}
                  {new Date(caseData.declined_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

        {caseData.user_note && (
          <CaseNotes
            noteText={noteText}
            setNoteText={setNoteText}
            isEditingNote={isEditingNote}
            noteSaving={noteSaving}
            noteError={noteError}
            handleEditNote={handleEditNote}
            handleCancelEditNote={handleCancelEditNote}
            handleSaveNote={handleSaveNote}
            caseData={caseData}
            isAdmin={true}
          />
        )}

        {/* Dental Chart */}
        <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
          <span className="text-heading-3 font-heading-3 text-default-font">
            Dental Chart
          </span>
          <div className="flex w-full justify-center">
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

        {/* Case Acceptance Card - Only for submitted cases */}
        <CaseAcceptanceCard
          currentStatus={currentStatus}
          caseStudyFee={caseStudyFee}
          setCaseStudyFee={setCaseStudyFee}
          saving={saving}
          acceptCase={acceptCase}
          handleDecline={handleDecline}
        />

        {/* Treatment Plan Editor - Only for accepted cases and beyond */}
        <AdminTreatmentPlanEditor
          caseData={caseData}
          currentStatus={currentStatus}
          isEditingPlan={isEditingPlan}
          upperJawAligners={upperJawAligners}
          setUpperJawAligners={setUpperJawAligners}
          lowerJawAligners={lowerJawAligners}
          setLowerJawAligners={setLowerJawAligners}
          estimatedDurationMonths={estimatedDurationMonths}
          setEstimatedDurationMonths={setEstimatedDurationMonths}
          caseStudyFee={caseStudyFee}
          setCaseStudyFee={setCaseStudyFee}
          alignersPrice={alignersPrice}
          setAlignersPrice={setAlignersPrice}
          deliveryCharges={deliveryCharges}
          setDeliveryCharges={setDeliveryCharges}
          alignerUnitPrice={alignerUnitPrice}
          isDisabled={isDisabled}
          handleStartEdit={handleStartEdit}
          handleCancelEdit={handleCancelEdit}
          handleSendForApproval={handleSendForApproval}
          handleDecline={handleDecline}
          caseHasViewer={caseHasViewer}
          handleViewerClick={handleViewerClick}
          viewerLink={viewerLink}
          iprData={iprData}
          onIPRSave={handleIPRSave}
        />

        {/* Manufacturing Progress - Only for approved cases and beyond */}
        <ManufacturingProgress
          currentStatus={currentStatus}
          isDisabled={isDisabled}
          handleStatusTransition={handleStatusTransition}
        />

        {/* Admin Notes Section */}
        <AdminNotesSection caseData={caseData} />

        <FileDownloadTable
          caseData={caseData}
          downloadingFiles={downloadingFiles}
          handleFileDownload={downloadSingleFile}
        />

        <div className="flex w-full items-center justify-end gap-2">
          {currentStatus === 'awaiting_user_approval' && (
            <Button
              variant="brand"
              icon={<FeatherCheck />}
              onClick={approvePlan}
              disabled={saving}
              className="w-auto"
            >
              Approve Plan
            </Button>
          )}
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

      <DeclineCaseDialog
        isOpen={showDeclineDialog}
        onClose={handleCloseDeclineDialog}
        onConfirm={handleConfirmDecline}
        isLoading={isDecliningCase}
      />
    </>
  );
};

export default AdminCasePageRefactored;
