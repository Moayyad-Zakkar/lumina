import React, { useEffect, useState } from 'react';
import { Link, useLoaderData, useNavigate, useRevalidator } from 'react-router';
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
import MaterialSelectionCards from '../components/case/MaterialSelectionCards';

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
  FeatherRefreshCw,
  FeatherCheck,
  FeatherX,
  FeatherAlertTriangle,
  FeatherEdit3,
} from '@subframe/core';
import { checkCaseTreatmentImages } from '../../helper/caseHasView';
import { isMaterialAvailableForCase } from '../../helper/materialPrices';
import ApprovalConfirmDialog from '../components/case/ApprovalConfirmDialog';
import DeclineCaseDialog from '../components/case/DeclineCaseDialog';
import CaseSatisfactionDisplay from '../components/case/CaseSatisfactionDisplay';
import RequestEditDialog from '../components/case/RequestEditDialog';
import TreatmentDetails from '../components/case/TreatmentDetails';
import { useIsMobile } from '../../hooks/useIsMobile';
import PatientManagementCard from '../components/case/PatientManagementCard';
import CasePhotosCard from '../components/CasePhotosCard';
import { Capacitor } from '@capacitor/core';

const CasePageRefactored = () => {
  const { t } = useTranslation();
  const { caseData, error } = useLoaderData();
  const revalidator = useRevalidator();
  const [actionError, setActionError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [caseHasViewer, setCaseHasViewer] = useState(false);
  const [isApprovalConfirmOpen, setIsApprovalConfirmOpen] = useState(false);
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
  const [isRequestEditOpen, setIsRequestEditOpen] = useState(false);

  // Material selection state
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(
    caseData?.aligner_material || null,
  );
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  
  // Custom hooks
  const { status, setStatus, alertContent, showPlanSection } = useCaseStatus(
    caseData?.status,
  );
  
  const canManagePatient = [
    'ready_for_delivery',
    'delivered',
    'completed',
  ].includes(status);
  
  const isMobile = useIsMobile();
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
  const navigate = useNavigate();
  
  
  // Fetch aligner materials when in awaiting_user_approval
  useEffect(() => {
    if (status === 'awaiting_user_approval' && caseData?.material_prices) {
      const fetchMaterials = async () => {
        setLoadingMaterials(true);
        try {
          const { data, error } = await supabase
            .from('services')
            .select('*')
            .eq('is_active', true)
            .eq('type', 'aligners_material')
            .order('id', { ascending: true });
          if (!error && data) {
            setAlignerMaterials(data);
          }
        } catch (err) {
          console.error('Error fetching materials:', err);
        } finally {
          setLoadingMaterials(false);
        }
      };
      fetchMaterials();
    }
  }, [status, caseData?.material_prices]);

  const handleRefresh = () => {
    revalidator.revalidate();
  };

  useEffect(() => {
    const checkImages = async () => {
      try {
        const { hasImages } = await checkCaseTreatmentImages(caseData.id);
        setCaseHasViewer(hasImages);
      } catch {
        setCaseHasViewer(false);
      }
    };
    if (caseData.id) checkImages();
  }, [caseData.id]);

  useEffect(() => {
    const markCaseNotificationsRead = async () => {
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
    markCaseNotificationsRead();
  }, [caseData?.id]);

  if (error) return <Error error={error} />;
  if (!caseData) {
    return <p className="text-neutral-500">{t('casePage.caseNotFound')}</p>;
  }

  // Derive total cost for the chosen material
  const getMaterialTotal = (materialName) => {
    const alignersPrice = parseFloat(
      caseData?.material_prices?.[materialName] || 0,
    );
    return (
      parseFloat(caseData?.case_study_fee || 0) +
      alignersPrice +
      parseFloat(caseData?.delivery_charges || 0)
    );
  };

  const approvePlan = async () => {
    if (
      !selectedMaterial ||
      !isMaterialAvailableForCase(caseData?.material_prices, selectedMaterial)
    ) {
      toast.error(t('casePage.materialSelection.required'));
      return;
    }

    try {
      setSaving(true);
      setActionError(null);

      const alignersPrice = parseFloat(
        caseData?.material_prices?.[selectedMaterial] || 0,
      );
      const totalCost = getMaterialTotal(selectedMaterial);

      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'approved',
          aligner_material: selectedMaterial,
          aligners_price: alignersPrice,
          total_cost: totalCost,
          approved_total_cost: totalCost,
        })
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      setStatus('approved');
      setIsApprovalConfirmOpen(false);
      toast.success(t('casePage.toast.planApproved'));
      handleRefresh();
    } catch (e) {
      setActionError(e.message || t('casePage.toast.approveFailed'));
      toast.error(e.message || t('casePage.toast.approveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const declinePlan = async (reason) => {
    const caseStudyFee = parseFloat(caseData?.case_study_fee || 0);

    try {
      setSaving(true);
      setActionError(null);
      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'user_rejected',
          approved_total_cost: caseStudyFee,
          decline_reason: reason,
        })
        .eq('id', caseData.id);
      if (updateError) throw updateError;

      setStatus('user_rejected');
      setIsDeclineDialogOpen(false);
      toast.success(t('casePage.toast.planDeclined'));
      handleRefresh();
    } catch (e) {
      setActionError(e.message || t('casePage.toast.declineFailed'));
      toast.error(e.message || t('casePage.toast.declineFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleViewerClick = () => {
    const path = `/case-viewer/${caseData.id}`;
    if (Capacitor.isNativePlatform()) {
      navigate(path); // stays in the app, so history exists and the back button appears
    } else {
      window.open(path, '_blank');
    }
  };


  const changeMaterial = async (newMaterial, materialChanged, userNote) => {
    try {
      setSaving(true);
      setActionError(null);

      const updateData = {
        user_note: userNote || null,
      };

      // No material change logic here anymore — material is picked at approval time.
      // "Request Edit" is only for notes / re-evaluation requests.
      const { error: updateError } = await supabase
        .from('cases')
        .update(updateData)
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      toast.success(t('casePage.toast.editRequested'));
      setIsRequestEditOpen(false);
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
      <div className="flex w-full min-w-0 flex-col items-start gap-3 md:gap-2">
        <Breadcrumbs>
          <Link to="/app/cases">
            <Breadcrumbs.Item>{t('navigation.cases')}</Breadcrumbs.Item>
          </Link>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>
            {t('casePage.caseDetails')}
          </Breadcrumbs.Item>
        </Breadcrumbs>

        <div className="flex w-full min-w-0 flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Title + badges: wraps instead of overflowing */}
          <div className="flex min-w-0 flex-wrap items-center gap-2 md:gap-4">
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

          {/* Action buttons: full-width stack on mobile, row from sm up.
              [&>*]:w-full forces each direct child (the buttons) to fill the
              container on mobile without relying on Button forwarding className. */}
          <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
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
          variant="success"
          icon={<FeatherAlertTriangle />}
          title={alertContent.title}
          description={alertContent.description}
          actions={null}
        />
      )}

      <div className="flex w-full min-w-0 flex-col items-start gap-4 md:gap-6">
        <CaseInformation caseData={caseData} isAdmin={false} />

        {/* Satisfaction Display */}
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
            <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-red-200 bg-red-50 px-4 pt-4 pb-5 shadow-sm md:px-6 md:pb-6">
              <div className="flex items-center gap-2">
                <FeatherAlertTriangle className="h-5 w-5 flex-none text-red-600" />
                <span className="text-heading-3 font-heading-3 text-red-900">
                  {status === 'user_rejected'
                    ? t('casePage.declineReason')
                    : t('casePage.rejectionReason')}
                </span>
              </div>
              <div className="w-full rounded-md border border-red-200 bg-white p-4 shadow-sm">
                <div className="whitespace-pre-wrap break-words text-body font-body leading-relaxed text-neutral-800">
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
        {!isMobile && (
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
        )}

        {/* Treatment Plan Section */}
        {showPlanSection && (
          <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-4 pt-4 pb-5 shadow-sm md:px-6 md:pb-6">
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

              {/* Material selection cards — only shown in awaiting_user_approval */}
              {status === 'awaiting_user_approval' && (
                <>
                  <div className="flex h-px w-full flex-none bg-neutral-border" />
                  <MaterialSelectionCards
                    materials={alignerMaterials}
                    materialPrices={caseData.material_prices || {}}
                    caseStudyFee={caseData.case_study_fee}
                    deliveryCharges={caseData.delivery_charges}
                    selectedMaterial={selectedMaterial}
                    onSelect={setSelectedMaterial}
                  />
                </>
              )}

              <div className="flex h-px w-full flex-none bg-neutral-border" />

              {/* Status message + plan actions.
                  On mobile the buttons stack full-width with Approve on top
                  (flex-col-reverse); from md up it's the original single row. */}
              <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span className="text-caption font-caption text-subtext-color md:text-body md:font-body">
                  {getStatusMessage()}
                </span>
                {status === 'awaiting_user_approval' && (
                  <div className="flex w-full flex-col-reverse gap-2 md:w-auto md:flex-row md:items-center [&>*]:w-full md:[&>*]:w-auto">
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
                      disabled={saving || !selectedMaterial}
                      onClick={() => setIsApprovalConfirmOpen(true)}
                    >
                      {t('casePage.approvePlan')}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {canManagePatient && (
          <>
            <PatientManagementCard
              caseData={caseData}
              onRefresh={handleRefresh}
            />
            <CasePhotosCard caseData={caseData} />
          </>
        )}

        {/* Refinement Section */}
        {!isMobile && (
          <RefinementSection caseData={caseData} onCaseUpdate={handleRefresh} />
        )}

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