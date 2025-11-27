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

  const [refinementFormData, setRefinementFormData] = useState({
    reason: '',
    alignerMaterial: '',
    uploadMethod: 'individual',
    upperJawScan: null,
    lowerJawScan: null,
    biteScan: null,
    compressedScans: null,
    additionalFiles: [],
  });

  const [satisfactionData, setSatisfactionData] = useState({
    rating: 0,
    message: '',
  });

  const canRequestRefinement = ['delivered'].includes(caseData?.status);

  useEffect(() => {
    if (isRefinementDialogOpen) {
      fetchServices();
      setRefinementFormData({
        reason: '',
        alignerMaterial: '',
        uploadMethod: 'individual',
        upperJawScan: null,
        lowerJawScan: null,
        biteScan: null,
        compressedScans: null,
        additionalFiles: [],
      });
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

  const handleRefinementChange = (e) => {
    const { name, value, files } = e.target;

    if (files) {
      setRefinementFormData((prevData) => ({
        ...prevData,
        [name]:
          name === 'additionalFiles'
            ? [...prevData.additionalFiles, ...files]
            : files[0],
      }));
    } else {
      setRefinementFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
    }
  };

  const handleRefinementSubmit = async () => {
    // Validate form
    if (!refinementFormData.reason.trim()) {
      setError(t('casePage.refinement.errors.reasonRequired'));
      return;
    }
    if (!refinementFormData.alignerMaterial) {
      setError(t('casePage.refinement.errors.materialRequired'));
      return;
    }

    // Validate files based on upload method
    if (refinementFormData.uploadMethod === 'individual') {
      if (
        !refinementFormData.upperJawScan ||
        !refinementFormData.lowerJawScan ||
        !refinementFormData.biteScan
      ) {
        setError(t('casePage.refinement.errors.allScansRequired'));
        return;
      }
    } else if (refinementFormData.uploadMethod === 'compressed') {
      if (!refinementFormData.compressedScans) {
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

      let upperJawResult, lowerJawResult, biteScanResult;

      // Upload based on method
      if (refinementFormData.uploadMethod === 'compressed') {
        const compressedResult = await uploadFile(
          refinementFormData.compressedScans,
          'refinement-scans/compressed',
          {
            caseId: caseData.id,
            patientName: `${caseData.first_name} ${caseData.last_name}`,
            fileType: 'compressed-scans',
          }
        );

        if (!compressedResult.success) {
          throw new Error(
            t('casePage.refinement.errors.compressedUploadFailed')
          );
        }

        upperJawResult = lowerJawResult = biteScanResult = compressedResult;
      } else {
        // Individual file uploads
        const uploadPromises = [
          uploadFile(
            refinementFormData.upperJawScan,
            'refinement-scans/upper-jaw',
            {
              caseId: caseData.id,
              patientName: `${caseData.first_name} ${caseData.last_name}`,
              fileType: 'upper-jaw-scan',
            }
          ),
          uploadFile(
            refinementFormData.lowerJawScan,
            'refinement-scans/lower-jaw',
            {
              caseId: caseData.id,
              patientName: `${caseData.first_name} ${caseData.last_name}`,
              fileType: 'lower-jaw-scan',
            }
          ),
          uploadFile(refinementFormData.biteScan, 'refinement-scans/bite', {
            caseId: caseData.id,
            patientName: `${caseData.first_name} ${caseData.last_name}`,
            fileType: 'bite-scan',
          }),
        ];

        [upperJawResult, lowerJawResult, biteScanResult] = await Promise.all(
          uploadPromises
        );

        if (
          !upperJawResult.success ||
          !lowerJawResult.success ||
          !biteScanResult.success
        ) {
          throw new Error(t('casePage.refinement.errors.scanUploadFailed'));
        }
      }

      // Upload additional files if any
      const additionalFilesPromises = (
        refinementFormData.additionalFiles || []
      ).map((file) =>
        uploadFile(file, 'refinement-scans/additional', {
          caseId: caseData.id,
          patientName: `${caseData.first_name} ${caseData.last_name}`,
          fileType: 'additional-file',
        })
      );

      const additionalResults = await Promise.all(additionalFilesPromises);

      const additionalFilesUrls = additionalResults
        .filter((result) => result.success)
        .map((result) => result.filePath);

      // Create new refinement case
      const { error: insertError } = await supabase.from('cases').insert({
        user_id: user.id,
        first_name: caseData.first_name,
        last_name: caseData.last_name,
        aligner_material: refinementFormData.alignerMaterial,
        parent_case_id: caseData.id,
        refinement_number: 1,
        refinement_reason: refinementFormData.reason,
        upload_method: refinementFormData.uploadMethod,
        upper_jaw_scan_url: upperJawResult.filePath,
        lower_jaw_scan_url: lowerJawResult.filePath,
        bite_scan_url: biteScanResult.filePath,
        additional_files_urls: additionalFilesUrls,
        status: 'submitted',
      });

      if (insertError) throw insertError;

      toast.success(t('casePage.refinement.success.submitted'));
      setIsRefinementDialogOpen(false);

      if (onCaseUpdate) onCaseUpdate();
    } catch (error) {
      console.error('Submit error:', error);
      setError(error.message || t('casePage.refinement.errors.submitFailed'));
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

      <RefinementDialog
        isOpen={isRefinementDialogOpen}
        onClose={handleRefinementClose}
        onSubmit={handleRefinementSubmit}
        formData={refinementFormData}
        onChange={handleRefinementChange}
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
