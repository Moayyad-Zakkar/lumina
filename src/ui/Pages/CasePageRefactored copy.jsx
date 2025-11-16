import React, { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { Badge } from '../components/Badge';
import Error from '../components/Error';
import CaseStatusBadge from '../components/CaseStatusBadge';
import supabase from '../../helper/supabaseClient';
import toast from 'react-hot-toast';
import RefinementSection from '../components/RefinementSection';
import RefinementHistory from '../components/RefinementHistory';
import DentalChart from '../components/DentalChart';

import { FeatherEye } from '@subframe/core';

// Import refactored components
import CaseInformation from '../components/case/CaseInformation';
import CaseNotes from '../components/case/CaseNotes';
import TreatmentPlanDisplay from '../components/case/TreatmentPlanDisplay';
import FileDownloadTable from '../components/case/FileDownloadTable';

// Import custom hooks
import { useCaseStatus } from '../../hooks/useCaseStatus';
import { useFileDownload } from '../../hooks/useFileDownload';
import { useCaseNotes } from '../../hooks/useCaseNotes';

import {
  FeatherDownload,
  FeatherPlay,
  FeatherRefreshCw,
  FeatherCheck,
  FeatherX,
  FeatherAlertTriangle,
} from '@subframe/core';
import { checkCaseTreatmentImages } from '../../helper/caseHasView';
import ApprovalDialog from '../components/case/ApprovalDialog';

const CasePageRefactored = () => {
  const { caseData, error } = useLoaderData();
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isAbortDialogOpen, setIsAbortDialogOpen] = useState(false);
  const [caseHasViewer, setCaseHasViewer] = useState(false);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);

  // Custom hooks
  const { status, setStatus, alertContent, showPlanSection } = useCaseStatus(
    caseData?.status
  );
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

  // Mark notifications for this case as read when the doctor opens the case
  useEffect(() => {
    const markCaseNotificationsRead = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        if (!caseData?.id) return;
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
    markCaseNotificationsRead();
  }, [caseData?.id]);

  if (error) {
    return <Error error={error} />;
  }

  if (!caseData) {
    return <p className="text-neutral-500">Case not found.</p>;
  }

  /*
  const approvePlan = async () => {
    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({ status: 'approved' })
        .eq('id', caseData.id);
      if (updateError) throw updateError;
      setStatus('approved');
      toast.success('Plan approved successfully');
    } catch (e) {
      setActionError(e.message || 'Failed to approve plan');
      toast.error(e.message || 'Failed to approve plan');
    } finally {
      setSaving(false);
    }
  };
  */

  const approvePlan = async () => {
    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({ status: 'approved' })
        .eq('id', caseData.id);
      if (updateError) throw updateError;
      setStatus('approved');
      setIsApprovalDialogOpen(false);
      toast.success('Plan approved successfully');
    } catch (e) {
      setActionError(e.message || 'Failed to approve plan');
      toast.error(e.message || 'Failed to approve plan');
    } finally {
      setSaving(false);
    }
  };

  const declinePlan = async () => {
    const CaseStudyFee = parseFloat(caseData?.case_study_fee || 0);

    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({ status: 'user_rejected', total_cost: CaseStudyFee })
        .eq('id', caseData.id);
      if (updateError) throw updateError;
      setStatus('user_rejected');
      toast.success('Plan declined successfully');
    } catch (e) {
      setActionError(e.message || 'Failed to decline plan');
      toast.error(e.message || 'Failed to decline plan');
    } finally {
      setSaving(false);
    }
  };
  /*
  const requestAbortion = async () => {
    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({ status: 'user_rejected' })
        .eq('id', caseData.id);
      if (updateError) throw updateError;
      setStatus('user_rejected');
      toast.success('Abortion request submitted');
    } catch (e) {
      setActionError(e.message || 'Failed to request abortion');
      toast.error(e.message || 'Failed to request abortion');
    } finally {
      setSaving(false);
    }
  };
*/

  const handleViewerClick = () => {
    // Open the viewer in a new tab with the case ID
    const viewerUrl = `/case-viewer/${caseData.id}`;
    window.open(viewerUrl, '_blank');
  };

  const handleApproveClick = () => {
    setIsApprovalDialogOpen(true);
  };

  const contactSupport = () => {
    setIsApprovalDialogOpen(false);
    // contact support logic here

    window.location.href =
      'mailto:support@3da.com?subject=Question about Treatment Plan';
    // or use: window.open('/contact-support', '_blank');
  };

  const changeMaterial = async (newMaterial, materialChanged) => {
    try {
      setSaving(true);
      setActionError(null);

      const updateData = {
        aligner_material: newMaterial,
      };

      // If material changed, set status back to 'accepted' for re-evaluation
      if (materialChanged) {
        updateData.status = 'accepted';
      }

      const { error: updateError } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      // Update local state
      if (materialChanged) {
        setStatus('accepted');
        toast.success(
          'Material updated. Case is sent for re-evaluation by admin.'
        );
      } else {
        toast.success('Material updated successfully.');
      }

      setIsApprovalDialogOpen(false);
    } catch (e) {
      setActionError(e.message || 'Failed to update material');
      toast.error(e.message || 'Failed to update material');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <Breadcrumbs>
          <Link to="/app/cases">
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
            <CaseStatusBadge status={status} />
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
                <Link to={`/app/cases/${caseData.parent_case_id}`}>
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
              {downloadingFiles.size > 0
                ? 'Downloading...'
                : 'Download All Files'}
            </Button>
            {caseHasViewer && (
              <Button onClick={handleViewerClick} icon={<FeatherEye />}>
                Open 3DA Viewer
              </Button>
            )}
          </div>
        </div>
      </div>

      {showPlanSection && (
        <Alert
          variant="brand"
          icon={<FeatherAlertTriangle />}
          title={alertContent.title}
          description={alertContent.description}
          actions={null}
        />
      )}

      <div className="flex w-full flex-col items-start gap-6">
        <CaseInformation caseData={caseData} isAdmin={false} />

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
          isAdmin={false}
        />

        {/* Dental Chart */}
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

        {/* Treatment Plan Section */}
        {showPlanSection && (
          <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Treatment Plan Review
            </span>
            {actionError && <Error error={actionError} />}
            <div className="flex w-full flex-col items-start gap-6">
              <TreatmentPlanDisplay
                caseHasViewer={caseHasViewer}
                caseData={caseData}
                showPlanSection={true}
              />

              <div className="flex h-px w-full flex-none flex-col items-center gap-2 bg-neutral-border" />
              <div className="flex w-full items-center justify-between">
                <span className="text-body font-body text-subtext-color">
                  {status === 'awaiting_user_approval'
                    ? 'Please review the treatment plan details and choose to approve or decline.'
                    : status === 'approved'
                    ? 'Your plan is approved. Production will start soon.'
                    : status === 'in_production'
                    ? 'Your aligners are currently being manufactured.'
                    : status === 'ready_for_delivery'
                    ? 'Your aligners are ready for delivery.'
                    : status === 'delivered'
                    ? 'Your aligners have been delivered. Follow your treatment schedule.'
                    : status === 'completed'
                    ? 'Your treatment is completed.'
                    : status === 'user_rejected'
                    ? 'You have declined the treatment plan.'
                    : ''}
                </span>
                <div className="flex items-center gap-2">
                  {status === 'awaiting_user_approval' && (
                    <>
                      <Button
                        variant="neutral-secondary"
                        disabled={saving}
                        onClick={declinePlan}
                      >
                        Decline Plan
                      </Button>
                      <Button
                        icon={<FeatherCheck />}
                        disabled={saving}
                        onClick={handleApproveClick}
                      >
                        Approve Plan
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <FileDownloadTable
          caseData={caseData}
          downloadingFiles={downloadingFiles}
          handleFileDownload={downloadSingleFile}
        />

        {/* Abort Button */
        /*<div className="flex w-full items-center justify-end">
          {(status === 'approved' || status === 'in_production') && (
            <Button
              variant="destructive-primary"
              icon={<FeatherX />}
              disabled={saving}
              onClick={() => setIsAbortDialogOpen(true)}
              className="w-auto"
            >
              Request Abortion
            </Button>
          )}
        </div>*/}

        {/* Refinement Section */}
        <RefinementSection caseData={caseData} />

        {/* Refinement History */}
        <RefinementHistory caseData={caseData} />
      </div>

      {/*
      isAbortDialogOpen && (
        <Dialog open={isAbortDialogOpen} onOpenChange={setIsAbortDialogOpen}>
          <Dialog.Content className="p-6 max-w-[480px]">
            <div className="flex items-start gap-3">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Confirm Abort Request
              </span>
            </div>
            <div className="mt-2 text-body font-body text-subtext-color">
              This will request aborting the case. This action may halt
              production if already started. Are you sure?
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="neutral-secondary"
                onClick={() => setIsAbortDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="destructive-primary"
                onClick={async () => {
                  await requestAbortion();
                  setIsAbortDialogOpen(false);
                }}
                disabled={saving}
                icon={<FeatherAlertTriangle />}
              >
                Confirm Abort
              </Button>
            </div>
          </Dialog.Content>
        </Dialog>
      )
      */}
      <ApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        onConfirmApprove={approvePlan}
        onChangeMaterial={changeMaterial}
        onContactSupport={contactSupport}
        saving={saving}
        caseData={caseData}
      />
    </>
  );
};

export default CasePageRefactored;
