import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import { FeatherPlus, FeatherCheck } from '@subframe/core';
import supabase from '../../helper/supabaseClient';
import { uploadFile } from '../../helper/storageUtils';
import toast from 'react-hot-toast';
import RefinementDialog from './RefinementDialog';
import SatisfactionDialog from './SatisfactionDialog';

const RefinementSection = ({ caseData, onCaseUpdate }) => {
  const { t } = useTranslation();
  const [isRefinementDialogOpen, setIsRefinementDialogOpen] = useState(false);
  const [isSatisfactionDialogOpen, setIsSatisfactionDialogOpen] =
    useState(false);
  const [loading, setLoading] = useState(false);
  const [alignerMaterials, setAlignerMaterials] = useState([]);
  const [loadingMaterials, setLoadingMaterials] = useState(false);
  const [error, setError] = useState(null);

  const [satisfactionData, setSatisfactionData] = useState({
    rating: 0,
    message: '',
  });

  const canRequestRefinement = ['delivered'].includes(caseData?.status);

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

  const handleRefinementSubmit = async (refinementData) => {
    // Validate form
    if (!refinementData.reason?.trim()) {
      setError(t('casePage.refinement.errors.reasonRequired'));
      return;
    }
    if (!refinementData.alignerMaterial) {
      setError(t('casePage.refinement.errors.materialRequired'));
      return;
    }

    // Validate files based on upload method
    if (refinementData.uploadMethod === 'individual') {
      if (
        !refinementData.upperJawScan ||
        !refinementData.lowerJawScan ||
        !refinementData.biteScan
      ) {
        setError(t('casePage.refinement.errors.allScansRequired'));
        return;
      }
    } else if (refinementData.uploadMethod === 'compressed') {
      if (!refinementData.compressedScans) {
        setError(t('casePage.refinement.errors.compressedRequired'));
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user)
        throw new Error(t('casePage.refinement.errors.notAuthenticated'));

      // Fetch doctor's profile information
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, clinic')
        .eq('id', user.id)
        .single();

      const doctorName =
        profileData?.full_name || user.email || 'Unknown Doctor';
      const clinicName = profileData?.clinic || null;
      const patientName = `${caseData.first_name} ${caseData.last_name}`;
      const refinementCaseId = `REF-${caseData.id}-${Date.now()}`;

      // Upload files helper
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

      // Get the latest refinement number for this parent case
      const { data: existingRefinements } = await supabase
        .from('cases')
        .select('refinement_number')
        .eq('parent_case_id', caseData.id)
        .order('refinement_number', { ascending: false })
        .limit(1);

      const nextRefinementNumber = existingRefinements?.[0]?.refinement_number
        ? existingRefinements[0].refinement_number + 1
        : 1;

      // Create refinement case with comprehensive data
      const insertPayload = {
        user_id: user.id,
        parent_case_id: caseData.id,
        refinement_number: nextRefinementNumber,
        first_name: caseData.first_name,
        last_name: caseData.last_name,
        refinement_reason: refinementData.reason.trim(),
        aligner_material: refinementData.alignerMaterial,
        treatment_arch: refinementData.treatmentArch || caseData.treatment_arch,
        upload_method: refinementData.uploadMethod,
        upper_jaw_scan_url: upperJawScanPath,
        lower_jaw_scan_url: lowerJawScanPath,
        bite_scan_url: biteScanPath,
        compressed_scans_url: compressedScansPath,
        additional_files_urls: additionalFilesPaths || [],
        // Include tooth status from dental chart
        tooth_status: refinementData.toothStatus || {},
        // Include diagnosis data
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

      if (onCaseUpdate) onCaseUpdate();
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.message || t('casePage.refinement.errors.submitFailed'));
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSatisfactionSubmit = async () => {
    if (satisfactionData.rating === 0) {
      setError(t('casePage.satisfaction.errors.ratingRequired'));
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { error: updateError } = await supabase
        .from('cases')
        .update({
          status: 'completed',
          satisfaction_rating: satisfactionData.rating,
          satisfaction_message: satisfactionData.message,
          completed_at: new Date().toISOString(),
        })
        .eq('id', caseData.id);

      if (updateError) throw updateError;

      toast.success(t('casePage.satisfaction.success.completed'));
      setIsSatisfactionDialogOpen(false);
      setSatisfactionData({ rating: 0, message: '' });

      if (onCaseUpdate) onCaseUpdate();
    } catch (error) {
      console.error('Error updating case:', error);
      setError(
        error.message || t('casePage.satisfaction.errors.completeFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefinementClose = () => {
    if (!loading) {
      setError(null);
      setIsRefinementDialogOpen(false);
    }
  };

  const handleSatisfactionClose = () => {
    if (!loading) {
      setError(null);
      setIsSatisfactionDialogOpen(false);
    }
  };

  if (!canRequestRefinement) {
    return null;
  }

  return (
    <>
      <div className="flex w-full flex-col items-start gap-4 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
        <span className="text-heading-3 font-heading-3 text-default-font">
          {t('casePage.refinement.caseActions')}
        </span>
        <p className="text-body font-body text-subtext-color">
          {t('casePage.refinement.description')}
        </p>
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setIsSatisfactionDialogOpen(true)}
            icon={<FeatherCheck />}
            className="w-auto"
          >
            {t('casePage.refinement.markCompleted')}
          </Button>
          <Button
            onClick={() => setIsRefinementDialogOpen(true)}
            icon={<FeatherPlus />}
            variant="neutral-secondary"
            className="w-auto"
          >
            {t('casePage.refinement.requestRefinement')}
          </Button>
        </div>
      </div>

      {/* Updated RefinementDialog with comprehensive data collection */}
      <RefinementDialog
        isOpen={isRefinementDialogOpen}
        onClose={handleRefinementClose}
        onSubmit={handleRefinementSubmit}
        originalCaseData={caseData}
        alignerMaterials={alignerMaterials}
        loadingMaterials={loadingMaterials}
        loading={loading}
        error={error}
      />

      <SatisfactionDialog
        isOpen={isSatisfactionDialogOpen}
        onClose={handleSatisfactionClose}
        onSubmit={handleSatisfactionSubmit}
        satisfactionData={satisfactionData}
        onRatingChange={(rating) =>
          setSatisfactionData((prev) => ({ ...prev, rating }))
        }
        onMessageChange={(message) =>
          setSatisfactionData((prev) => ({ ...prev, message }))
        }
        loading={loading}
        error={error}
      />
    </>
  );
};

export default RefinementSection;
