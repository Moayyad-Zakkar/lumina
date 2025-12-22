import React, { useEffect, useState } from 'react';
import { Link, useLoaderData, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
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
import RefinementDialog from '../../components/RefinementDialog';
import RefinementHistory from '../../components/RefinementHistory';

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
import { uploadFile } from '../../../helper/storageUtils';
import { checkCaseTreatmentImages } from '../../../helper/caseHasView';
import TreatmentDetails from '../../components/case/TreatmentDetails';
import CaseSatisfactionDisplay from '../../components/case/CaseSatisfactionDisplay';
import InternalNotesSection from '../../components/case/InternalNotesSection';
import { useUserRole } from '../../../helper/useUserRole';

const AdminCasePageRefactored = () => {
  const { t } = useTranslation();
  const { caseData, error } = useLoaderData();
  const navigate = useNavigate();
  const [caseHasViewer, setCaseHasViewer] = useState(false);
  const { role, loading: roleLoading } = useUserRole();
  const isAdmin = role === 'admin';

  const [isRefinementDialogOpen, setIsRefinementDialogOpen] = useState(false);
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [refinementError, setRefinementError] = useState(null);
  const [isSubmittingRefinement, setIsSubmittingRefinement] = useState(false);

  // Fetch services when refinement dialog opens
  useEffect(() => {
    if (isRefinementDialogOpen) {
      fetchServices();
    }
  }, [isRefinementDialogOpen]);

  const fetchServices = async () => {
    setLoadingMaterials(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      setAlignerMaterials(
        data.filter((item) => item.type === 'aligners_material')
      );
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error(t('casePage.refinement.errors.loadServicesFailed'));
    } finally {
      setLoadingMaterials(false);
    }
  };

  // Initialize IPR data from caseData
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

  // Update iprData when caseData changes
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

  // Check if the case has treatment sequence viewer available
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

  if (error) {
    return <Error error={error} />;
  }
  if (!caseData) {
    return <p className="text-neutral-500">{t('casePage.caseNotFound')}</p>;
  }

  const handleDeleteCase = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseData.id);
      if (deleteError) throw deleteError;
      setIsDeleteDialogOpen(false);
      toast.success(t('adminCasePage.toast.caseDeleted'));
      navigate('/admin/cases');
    } catch (e) {
      toast.error(e.message || t('adminCasePage.toast.deleteFailed'));
    }
  };

  const handleViewerClick = () => {
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

      setIprData(data);
      caseData.ipr_data = data;

      toast.success(t('adminCasePage.toast.iprSaved'));
    } catch (error) {
      console.error('Error saving IPR data:', error);
      toast.error(t('adminCasePage.toast.iprFailed'));
    }
  };

  const approvePlan = async () => {
    try {
      await updateCase({ status: 'approved' });
      toast.success(t('casePage.toast.planApproved'));
    } catch (e) {
      toast.error(e.message || t('casePage.toast.approveFailed'));
    }
  };

  const handleRefinementSubmit = async (refinementData) => {
    try {
      setIsSubmittingRefinement(true);
      setRefinementError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user)
        throw new Error(t('casePage.refinement.errors.notAuthenticated'));

      // Use the case's doctor info instead of current user
      const doctorName = caseData.profiles?.full_name || 'Unknown Doctor';
      const clinicName = caseData.profiles?.clinic || null;
      const patientName = `${caseData.first_name} ${caseData.last_name}`;
      const refinementCaseId = `REF-${caseData.id}-${Date.now()}`;

      // Upload files helper (same as RefinementSection)
      const uploadFileWithErrorHandling = async (
        file,
        folderPath,
        metadata = {}
      ) => {
        if (!file) return null;

        try {
          const result = await uploadFile(file, folderPath, {
            caseId: metadata.caseId || refinementCaseId,
            patientName: metadata.patientName || patientName,
            fileType: metadata.fileType || folderPath,
            doctorName: metadata.doctorName || doctorName,
          });

          if (!result.success) {
            throw new Error(result.error || 'Upload failed');
          }

          return result.filePath;
        } catch (error) {
          console.error(`Upload error for ${folderPath}:`, error);
          throw error;
        }
      };

      let upperJawScanPath = null;
      let lowerJawScanPath = null;
      let biteScanPath = null;
      let compressedScansPath = null;
      let additionalFilesPaths = [];

      // Upload based on method
      if (refinementData.uploadMethod === 'individual') {
        const uploadResults = await Promise.all([
          uploadFileWithErrorHandling(
            refinementData.upperJawScan,
            'upper-jaw-scans',
            {
              caseId: refinementCaseId,
              patientName,
              doctorName,
              clinicName,
              fileType: t('caseSubmit.upperJawScan'),
            }
          ),
          uploadFileWithErrorHandling(
            refinementData.lowerJawScan,
            'lower-jaw-scans',
            {
              caseId: refinementCaseId,
              patientName,
              doctorName,
              clinicName,
              fileType: t('caseSubmit.lowerJawScan'),
            }
          ),
          uploadFileWithErrorHandling(refinementData.biteScan, 'bite-scans', {
            caseId: refinementCaseId,
            patientName,
            doctorName,
            clinicName,
            fileType: t('caseSubmit.biteScan'),
          }),
        ]);

        [upperJawScanPath, lowerJawScanPath, biteScanPath] = uploadResults;
      } else if (refinementData.uploadMethod === 'compressed') {
        compressedScansPath = await uploadFileWithErrorHandling(
          refinementData.compressedScans,
          'compressed-scans',
          {
            caseId: refinementCaseId,
            patientName,
            doctorName,
            clinicName,
            fileType: t('caseSubmit.compressedScans'),
          }
        );
      }

      // Upload additional files if any
      if (
        refinementData.additionalFiles &&
        refinementData.additionalFiles.length > 0
      ) {
        additionalFilesPaths = await Promise.all(
          refinementData.additionalFiles.map((file, index) =>
            uploadFileWithErrorHandling(file, 'additional-files', {
              caseId: refinementCaseId,
              patientName,
              doctorName,
              clinicName,
              fileType: t('caseSubmit.additionalFile', { number: index + 1 }),
            })
          )
        );
      }

      // Get the latest refinement number
      const { data: existingRefinements } = await supabase
        .from('cases')
        .select('refinement_number')
        .eq('parent_case_id', caseData.id)
        .order('refinement_number', { ascending: false })
        .limit(1);

      const nextRefinementNumber = existingRefinements?.[0]?.refinement_number
        ? existingRefinements[0].refinement_number + 1
        : 1;

      // Create refinement case
      const insertPayload = {
        user_id: caseData.user_id, // Use original case's doctor
        parent_case_id: caseData.id,
        refinement_number: nextRefinementNumber,
        first_name: caseData.first_name,
        last_name: caseData.last_name,
        refinement_reason: refinementData.reason?.trim() || 'Admin refinement',
        aligner_material:
          refinementData.alignerMaterial || caseData.aligner_material,
        treatment_arch: refinementData.treatmentArch || caseData.treatment_arch,
        upload_method: refinementData.uploadMethod,
        upper_jaw_scan_url: upperJawScanPath,
        lower_jaw_scan_url: lowerJawScanPath,
        bite_scan_url: biteScanPath,
        compressed_scans_url: compressedScansPath,
        additional_files_urls: additionalFilesPaths || [],
        tooth_status: refinementData.toothStatus || {},
        upper_midline: refinementData.upperMidline || null,
        upper_midline_shift: refinementData.upperMidlineShift || null,
        lower_midline: refinementData.lowerMidline || null,
        lower_midline_shift: refinementData.lowerMidlineShift || null,
        canine_right_class: refinementData.canineRightClass || null,
        canine_left_class: refinementData.canineLeftClass || null,
        molar_right_class: refinementData.molarRightClass || null,
        molar_left_class: refinementData.molarLeftClass || null,
        status: 'submitted',
      };

      const { error: insertError } = await supabase
        .from('cases')
        .insert(insertPayload);

      if (insertError) throw insertError;

      toast.success(t('casePage.refinement.success.submitted'));
      setIsRefinementDialogOpen(false);

      // Refresh the page data
      window.location.reload();
    } catch (error) {
      console.error('Submit error:', error);
      setRefinementError(
        error.message || t('casePage.refinement.errors.submitFailed')
      );
      toast.error(error.message);
    } finally {
      setIsSubmittingRefinement(false);
    }
  };

  const handleRefinementClose = () => {
    if (!isSubmittingRefinement) {
      setRefinementError(null);
      setIsRefinementDialogOpen(false);
    }
  };

  return (
    <>
      <div className="flex w-full flex-col items-start gap-2">
        <Breadcrumbs>
          <Link to="/admin/cases">
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
            <CaseStatusBadge status={currentStatus} />
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
                <Link to={`/admin/cases/${caseData.parent_case_id}`}>
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

      {/* Delete Confirmation Dialog */}
      {isDeleteDialogOpen && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <Dialog.Content className="p-6 max-w-[480px]">
            <div className="flex items-start gap-3">
              <span className="text-heading-3 font-heading-3 text-default-font">
                {t('casePage.deleteCase')}
              </span>
            </div>
            <div className="mt-2 text-body font-body text-subtext-color">
              {t('casePage.deleteCaseConfirm')}
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                variant="neutral-secondary"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={saving}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="destructive-primary"
                onClick={handleDeleteCase}
                disabled={saving}
                icon={<FeatherAlertTriangle />}
              >
                {t('common.delete')}
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
          title={t('adminCasePage.caseDeclined')}
          description={
            <div className="space-y-2">
              <p>
                <strong>{t('casePage.reason')}:</strong>{' '}
                {caseData.decline_reason}
              </p>
              {caseData.declined_at && (
                <p className="text-sm opacity-75">
                  {t('casePage.declinedOn')}{' '}
                  {new Date(caseData.declined_at).toLocaleDateString()}{' '}
                  {t('casePage.at')}{' '}
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
              {isUndoingDecline
                ? t('casePage.undoing')
                : t('casePage.undoDecline')}
            </Button>
          }
        />
      )}

      {/* Standard status alert for non-rejected cases */}
      {currentStatus !== 'rejected' && currentStatus !== 'user_rejected' && (
        <Alert
          variant="success"
          icon={<FeatherBell />}
          title={t(`casePage.alerts.${currentStatus}.title`)}
          description={t(`casePage.alerts.${currentStatus}.description`)}
          actions={null}
        />
      )}

      {/* User rejected alert */}
      {currentStatus === 'user_rejected' && (
        <Alert
          variant="destructive"
          icon={<FeatherAlertTriangle />}
          title={t('casePage.alerts.user_rejected.title')}
          description={t('casePage.alerts.user_rejected.description')}
          actions={null}
        />
      )}

      <div className="flex w-full flex-col items-start gap-6">
        <CaseInformation caseData={caseData} isAdmin={true} />

        {/* Satisfaction Display */}
        {currentStatus === 'completed' && caseData.satisfaction_rating && (
          <CaseSatisfactionDisplay caseData={caseData} />
        )}
        {/* Decline Reason Section */}
        {(currentStatus === 'user_rejected' || currentStatus === 'rejected') &&
          caseData.decline_reason && (
            <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-red-200 bg-red-50 px-6 pt-4 pb-6 shadow-sm">
              <div className="flex items-center gap-2">
                <FeatherAlertTriangle className="w-5 h-5 text-red-600" />
                <span className="text-heading-3 font-heading-3 text-red-900">
                  {currentStatus === 'user_rejected'
                    ? t('adminCasePage.doctorDeclineReason')
                    : t('adminCasePage.adminDeclineReason')}
                </span>
              </div>
              <div className="w-full bg-white border border-red-200 rounded-md p-4 shadow-sm">
                <div className="text-body font-body text-neutral-800 whitespace-pre-wrap break-words leading-relaxed">
                  {caseData.decline_reason}
                </div>
              </div>
              {caseData.declined_at && (
                <div className="text-caption font-caption text-red-700">
                  {t('casePage.declinedOn')}{' '}
                  {new Date(caseData.declined_at).toLocaleDateString()}{' '}
                  {t('casePage.at')}{' '}
                  {new Date(caseData.declined_at).toLocaleTimeString()}
                </div>
              )}
            </div>
          )}

        <InternalNotesSection caseData={caseData} />
        <TreatmentDetails caseData={caseData} />

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

        {/* Case Acceptance Card - Only for submitted cases */}
        <CaseAcceptanceCard
          currentStatus={currentStatus}
          caseStudyFee={caseStudyFee}
          setCaseStudyFee={setCaseStudyFee}
          saving={saving}
          acceptCase={acceptCase}
          handleDecline={handleDecline}
        />

        {/* Admin Notes Section */}
        <AdminNotesSection caseData={caseData} />

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

        <FileDownloadTable
          caseData={caseData}
          downloadingFiles={downloadingFiles}
          handleFileDownload={downloadSingleFile}
        />

        {/* Refinement History */}
        <RefinementHistory caseData={caseData} />

        {/* Admin Buttons */}
        <div className="flex w-full items-center justify-end gap-2">
          {currentStatus === 'delivered' && (
            <Button
              variant="brand-secondary"
              icon={<FeatherRefreshCw />}
              onClick={() => setIsRefinementDialogOpen(true)}
              className="w-auto"
            >
              {t('casePage.refinement.requestRefinement')}
            </Button>
          )}
          {currentStatus === 'awaiting_user_approval' && (
            <Button
              variant="brand"
              icon={<FeatherCheck />}
              onClick={approvePlan}
              disabled={saving}
              className="w-auto"
            >
              {t('adminCasePage.approvePlan')}
            </Button>
          )}
          <Button
            variant="destructive-primary"
            icon={<FeatherAlertTriangle />}
            onClick={() => setIsDeleteDialogOpen(true)}
            className="w-auto"
          >
            {t('casePage.deleteCase')}
          </Button>
        </div>
      </div>

      {/* Refinement Dialog */}
      <RefinementDialog
        isOpen={isRefinementDialogOpen}
        onClose={handleRefinementClose}
        onSubmit={handleRefinementSubmit}
        originalCaseData={caseData}
        alignerMaterials={alignerMaterials}
        loadingMaterials={loadingMaterials}
        loading={isSubmittingRefinement}
        error={refinementError}
        isAdminMode={true} // Add this prop to make fields optional
      />

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
