import React, { useEffect, useState } from 'react';
import { Link, useLoaderData, useRevalidator } from 'react-router';
import { useTranslation } from 'react-i18next';
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
  FeatherEdit3,
} from '@subframe/core';
import { checkCaseTreatmentImages } from '../../helper/caseHasView';
import ApprovalConfirmDialog from '../components/case/ApprovalConfirmDialog';
import DeclineCaseDialog from '../components/case/DeclineCaseDialog';
import CaseSatisfactionDisplay from '../components/case/CaseSatisfactionDisplay';
import RequestEditDialog from '../components/case/RequestEditDialog';
import TreatmentDetails from '../components/case/TreatmentDetails';

const CasePageRefactored = () => {
  const { t } = useTranslation();
  const { caseData, error } = useLoaderData();
  const revalidator = useRevalidator(); // [!code change] Initialize revalidator
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [caseHasViewer, setCaseHasViewer] = useState(false);
  const [isApprovalConfirmOpen, setIsApprovalConfirmOpen] = useState(false);
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [isRequestEditOpen, setIsRequestEditOpen] = useState(false);

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

  // [!code change] Helper to refresh data
  const handleRefresh = () => {
    revalidator.revalidate();
  };

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
    return <p className="text-neutral-500">{t('casePage.caseNotFound')}</p>;
  }

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
      setIsApprovalConfirmOpen(false);
      toast.success(t('casePage.toast.planApproved'));

      // [!code change] Refresh data from server
      handleRefresh();
    } catch (e) {
      setActionError(e.message || t('casePage.toast.approveFailed'));
      toast.error(e.message || t('casePage.toast.approveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const declinePlan = async (reason) => {
    const CaseStudyFee = parseFloat(caseData?.case_study_fee || 0);

    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'user_rejected',
          total_cost: CaseStudyFee,
          decline_reason: reason,
        })
        .eq('id', caseData.id);
      if (updateError) throw updateError;

      setStatus('user_rejected');
      setIsDeclineDialogOpen(false);
      toast.success(t('casePage.toast.planDeclined'));

      // [!code change] Refresh data from server
      handleRefresh();
    } catch (e) {
      setActionError(e.message || t('casePage.toast.declineFailed'));
      toast.error(e.message || t('casePage.toast.declineFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleViewerClick = () => {
    // Open the viewer in a new tab with the case ID
    const viewerUrl = `/case-viewer/${caseData.id}`;
    window.open(viewerUrl, '_blank');
  };

  const changeMaterial = async (newMaterial, materialChanged, userNote) => {
    try {
      setSaving(true);
      setActionError(null);

      const updateData = {
        aligner_material: newMaterial,
        user_note: userNote || null,
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
        toast.success(t('casePage.toast.materialUpdatedReeval'));
      } else {
        toast.success(t('casePage.toast.materialUpdated'));
      }

      setIsRequestEditOpen(false);

      // [!code change] Refresh data from server
      handleRefresh();
    } catch (e) {
      setActionError(e.message || t('casePage.toast.updateMaterialFailed'));
      toast.error(e.message || t('casePage.toast.updateMaterialFailed'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'awaiting_user_approval':
        return t('casePage.statusMessages.awaitingApproval');
      case 'approved':
        return t('casePage.statusMessages.approved');
      case 'in_production':
        return t('casePage.statusMessages.inProduction');
      case 'ready_for_delivery':
        return t('casePage.statusMessages.readyForDelivery');
      case 'delivered':
        return t('casePage.statusMessages.delivered');
      case 'completed':
        return t('casePage.statusMessages.completed');
      case 'user_rejected':
        return t('casePage.statusMessages.userRejected');
      default:
        return '';
    }
  };

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <Breadcrumbs>
          <Link to="/app/cases">
            <Breadcrumbs.Item>{t('navigation.cases')}</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>
            {t('casePage.caseDetails')}
          </Breadcrumbs.Item>
        </Breadcrumbs>
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-heading-2 font-heading-2 text-default-font">
              {t('casePage.caseNumber', { id: caseData.id })}
            </span>
            <CaseStatusBadge status={status} />
            {caseData.parent_case_id && (
              <Badge variant="brand" icon={<FeatherRefreshCw />}>
                {t('casePage.refinementBadge', {
                  number: caseData.refinement_number || 1,
                })}
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
                  {t('casePage.viewOriginalCase')}
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
                ? t('casePage.downloading')
                : t('casePage.downloadFiles')}
            </Button>
            {caseHasViewer && (
              <Button onClick={handleViewerClick} icon={<FeatherEye />}>
                {t('casePage.openViewer')}
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

        {/* Satisfaction Display */}
        {/* [!code change] Added onRefresh prop. Ensure Child calls this on success */}
        {status === 'completed' && caseData.satisfaction_rating && (
          <CaseSatisfactionDisplay
            caseData={caseData}
            onRefresh={handleRefresh}
          />
        )}

        <TreatmentDetails caseData={caseData} />
        {/* Decline Reason Section */}
        {(status === 'user_rejected' || status === 'rejected') &&
          caseData.decline_reason && (
            <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-red-200 bg-red-50 px-6 pt-4 pb-6 shadow-sm">
              <div className="flex items-center gap-2">
                <FeatherAlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-heading-3 font-heading-3 text-red-900">
                  {status === 'user_rejected'
                    ? t('casePage.declineReason')
                    : t('casePage.rejectionReason')}
                </span>
              </div>
              <div className="w-full bg-white border border-red-200 rounded-md p-4 shadow-sm">
                <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                  {caseData.decline_reason}
                </div>
              </div>
            </div>
          )}

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
            {t('casePage.dentalChart')}
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

        {/* Treatment Plan Section */}
        {showPlanSection && (
          <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
            <span className="text-heading-3 font-heading-3 text-default-font">
              {t('casePage.treatmentPlanReview')}
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
                  {getStatusMessage()}
                </span>
                <div className="flex items-center gap-2">
                  {status === 'awaiting_user_approval' && (
                    <>
                      <Button
                        variant="destructive-secondary"
                        icon={<FeatherX />}
                        disabled={saving}
                        onClick={() => setIsDeclineDialogOpen(true)}
                      >
                        {t('casePage.declinePlan')}
                      </Button>
                      <Button
                        variant="neutral-secondary"
                        icon={<FeatherEdit3 />}
                        disabled={saving}
                        onClick={() => setIsRequestEditOpen(true)}
                      >
                        {t('casePage.requestEdit')}
                      </Button>
                      <Button
                        variant="brand-primary"
                        icon={<FeatherCheck />}
                        disabled={saving}
                        onClick={() => setIsApprovalConfirmOpen(true)}
                      >
                        {t('casePage.approvePlan')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Refinement Section */}
        <RefinementSection
          caseData={caseData}
          onCaseUpdate={handleRefresh} // or revalidator.revalidate
        />
        {/* Refinement History */}
        <RefinementHistory caseData={caseData} />

        <FileDownloadTable
          caseData={caseData}
          downloadingFiles={downloadingFiles}
          handleFileDownload={downloadSingleFile}
        />
      </div>

      {/* Approval Confirmation Dialog */}
      <ApprovalConfirmDialog
        isOpen={isApprovalConfirmOpen}
        onClose={() => setIsApprovalConfirmOpen(false)}
        onConfirm={approvePlan}
        isLoading={saving}
      />

      {/* Decline Dialog */}
      <DeclineCaseDialog
        isOpen={isDeclineDialogOpen}
        onClose={() => setIsDeclineDialogOpen(false)}
        onConfirm={declinePlan}
        isLoading={saving}
      />

      {/* Request Edit Dialog */}
      <RequestEditDialog
        isOpen={isRequestEditOpen}
        onClose={() => setIsRequestEditOpen(false)}
        onChangeMaterial={changeMaterial}
        saving={saving}
        caseData={caseData}
      />
    </>
  );
};

export default CasePageRefactored;
