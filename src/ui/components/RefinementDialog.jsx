import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherRefreshCw, FeatherCheck } from '@subframe/core';
import { Button } from './Button';
import { Loader } from './Loader';
import DialogWrapper from './DialogWrapper';
import AlertBox from './AlertBox';
import TreatmentOptionsForm from './case/TreatmentOptionsForm';
import DiagnosisForm from './case/DiagnosisForm';
import DentalChart from './DentalChart';
import FileUploadSection from './case/FileUploadSection';

const RefinementDialog = ({
  isOpen,
  onClose,
  onSubmit,
  originalCaseData,
  alignerMaterials,
  loadingMaterials,
  loading,
  error,
  isAdminMode = false,
}) => {
  const { t } = useTranslation();

  // Initialize form data with original case data as defaults
  const [formData, setFormData] = useState({
    reason: '',
    alignerMaterial: originalCaseData?.aligner_material || '',
    treatmentArch: originalCaseData?.treatment_arch || '',
    uploadMethod: 'individual',
    upperJawScan: null,
    lowerJawScan: null,
    biteScan: null,
    compressedScans: null,
    additionalFiles: [],
    // Diagnosis data from original case
    upperMidline: originalCaseData?.upper_midline || '',
    upperMidlineShift: originalCaseData?.upper_midline_shift || '',
    lowerMidline: originalCaseData?.lower_midline || '',
    lowerMidlineShift: originalCaseData?.lower_midline_shift || '',
    canineRightClass: originalCaseData?.canine_right_class || '',
    canineLeftClass: originalCaseData?.canine_left_class || '',
    molarRightClass: originalCaseData?.molar_right_class || '',
    molarLeftClass: originalCaseData?.molar_left_class || '',
  });

  // Initialize tooth status with original case data
  const [toothStatus, setToothStatus] = useState(
    originalCaseData?.tooth_status || {}
  );

  // Reset form when dialog opens with new case data
  useEffect(() => {
    if (isOpen && originalCaseData) {
      setFormData({
        reason: '',
        alignerMaterial: originalCaseData?.aligner_material || '',
        treatmentArch: originalCaseData?.treatment_arch || '',
        uploadMethod: 'individual',
        upperJawScan: null,
        lowerJawScan: null,
        biteScan: null,
        compressedScans: null,
        additionalFiles: [],
        upperMidline: originalCaseData?.upper_midline || '',
        upperMidlineShift: originalCaseData?.upper_midline_shift || '',
        lowerMidline: originalCaseData?.lower_midline || '',
        lowerMidlineShift: originalCaseData?.lower_midline_shift || '',
        canineRightClass: originalCaseData?.canine_right_class || '',
        canineLeftClass: originalCaseData?.canine_left_class || '',
        molarRightClass: originalCaseData?.molar_right_class || '',
        molarLeftClass: originalCaseData?.molar_left_class || '',
      });
      setToothStatus(originalCaseData?.tooth_status || {});
    }
  }, [isOpen, originalCaseData]);

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target;

    if (files) {
      setFormData((prevData) => ({
        ...prevData,
        [name]:
          name === 'additionalFiles'
            ? [...prevData.additionalFiles, ...files]
            : files[0],
      }));
    } else if (type === 'checkbox') {
      setFormData((prevData) => ({
        ...prevData,
        [name]: checked,
      }));
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));

      // Clear shift values when midline is centered
      if (name === 'upperMidline' && value === 'centered') {
        setFormData((prevData) => ({
          ...prevData,
          upperMidlineShift: '',
        }));
      }
      if (name === 'lowerMidline' && value === 'centered') {
        setFormData((prevData) => ({
          ...prevData,
          lowerMidlineShift: '',
        }));
      }

      // Clear opposite upload method files
      if (name === 'uploadMethod' && value === 'compressed') {
        setFormData((prevData) => ({
          ...prevData,
          upperJawScan: null,
          lowerJawScan: null,
          biteScan: null,
        }));
      }

      if (name === 'uploadMethod' && value === 'individual') {
        setFormData((prevData) => ({
          ...prevData,
          compressedScans: null,
        }));
      }
    }
  };

  const handleSubmit = () => {
    // Pass both formData and toothStatus to parent
    onSubmit({ ...formData, toothStatus });
  };

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={t('casePage.refinement.dialog.title')}
      description={t('casePage.refinement.dialog.description')}
      icon={<FeatherRefreshCw />}
      loading={loading}
      maxWidth="max-w-[900px]" // Wider for more content
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto px-1">
        {/* Info Alert */}
        <AlertBox
          variant="warning"
          title={t('casePage.refinement.dialog.warningTitle')}
          message={t('casePage.refinement.dialog.warningMessage')}
        />

        {error && (
          <AlertBox variant="error" title={t('common.error')} message={error} />
        )}

        {/* Reason for Refinement */}
        <div className="border border-neutral-border rounded-md p-4 bg-default-background">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="reason"
              className="text-body-bold font-body-bold text-default-font"
            >
              {t('casePage.refinement.dialog.reasonLabel')}{' '}
              {!isAdminMode && <span className="text-red-500">*</span>}
            </label>
            <p className="text-body font-body text-subtext-color -mt-1 mb-2">
              {t('casePage.refinement.dialog.reasonHelp')}
            </p>
            <textarea
              id="reason"
              value={formData.reason}
              onChange={handleChange}
              name="reason"
              placeholder={t('casePage.refinement.dialog.reasonPlaceholder')}
              rows={4}
              disabled={loading}
              className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-vertical min-h-[100px] placeholder:text-subtext-color disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* Treatment Options Form */}
        <div className="border border-neutral-border rounded-md bg-default-background">
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-heading-3 font-heading-3 text-default-font mb-2">
              {t('casePage.treatmentOptions')}
            </h3>
            <p className="text-body font-body text-subtext-color mb-4">
              {t('casePage.refinement.dialog.treatmentOptionsUpdate')}
            </p>
          </div>
          <div className="px-4 pb-4">
            <TreatmentOptionsForm
              formData={formData}
              handleChange={handleChange}
              alignerMaterials={alignerMaterials}
            />
          </div>
        </div>

        {/* Dental Chart */}
        <div className="border border-neutral-border rounded-md p-4 bg-default-background">
          <h3 className="text-heading-3 font-heading-3 text-default-font mb-2">
            {t('casePage.dentalChart')}
          </h3>
          <p className="text-body font-body text-subtext-color mb-4">
            {t('casePage.refinement.dialog.dentalChartUpdate')}
          </p>
          <div
            className="flex w-full justify-center"
            style={{ transform: 'scale(90%)' }}
          >
            <DentalChart
              initialStatus={toothStatus}
              onChange={setToothStatus}
            />
          </div>
        </div>

        {/* Diagnosis Form */}
        <div className="border border-neutral-border rounded-md bg-default-background">
          <div className="px-4 pt-3 pb-1">
            <h3 className="text-heading-3 font-heading-3 text-default-font mb-2">
              {t('caseSubmit.diagnosis.title')}
            </h3>
            <p className="text-body font-body text-subtext-color mb-4">
              {t('casePage.refinement.dialog.diagnosisUpdate')}
            </p>
          </div>
          <div className="px-4 pb-4">
            <DiagnosisForm formData={formData} handleChange={handleChange} />
          </div>
        </div>

        {/* File Upload Section */}
        <FileUploadSection
          formData={formData}
          handleChange={handleChange}
          isRequired={true}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 mt-6 pt-4 border-t border-neutral-border">
        <Button
          variant="neutral-secondary"
          onClick={onClose}
          disabled={loading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          variant="brand-primary"
          icon={<FeatherCheck />}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? t('casePage.refinement.dialog.submitting')
            : t('casePage.refinement.dialog.submitButton')}
        </Button>
      </div>
    </DialogWrapper>
  );
};

export default RefinementDialog;
