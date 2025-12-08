import React from 'react';
import { useTranslation } from 'react-i18next';

const TreatmentDetails = ({ caseData }) => {
  const { t } = useTranslation();

  if (!caseData) return null;

  // Helper to translate arch values
  const getArchLabel = (arch) => {
    if (!arch) return t('casePage.notSpecified');

    const archMap = {
      upper: 'caseSubmit.treatmentOptions.upperArch',
      lower: 'caseSubmit.treatmentOptions.lowerArch',
      both: 'caseSubmit.treatmentOptions.bothArches',
    };

    return t(archMap[arch] || arch);
  };

  // Helper to translate midline values
  const getMidlineLabel = (midline) => {
    if (!midline) return t('casePage.notSpecified');

    const midlineMap = {
      centered: 'caseSubmit.diagnosis.centered',
      shifted_right: 'caseSubmit.diagnosis.shiftedRight',
      shifted_left: 'caseSubmit.diagnosis.shiftedLeft',
    };

    return t(midlineMap[midline] || midline);
  };

  // Helper to translate class values
  const getClassLabel = (classValue) => {
    if (!classValue) return t('casePage.notSpecified');

    const classMap = {
      class_i: 'caseSubmit.diagnosis.classI',
      class_ii: 'caseSubmit.diagnosis.classII',
      class_iii: 'caseSubmit.diagnosis.classIII',
    };

    return t(classMap[classValue] || classValue);
  };

  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        {t('casePage.treatmentOptionsTitle')}
      </span>

      {/* Treatment Options Section */}
      <div className="w-full">
        <span className="text-body-bold font-body-bold text-default-font mb-3 block">
          {t('casePage.treatmentOptions')}
        </span>
        <div className="flex flex-wrap items-start gap-8">
          {/* Treatment Arch */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-caption font-caption text-subtext-color uppercase">
              {t('caseSubmit.treatmentOptions.treatmentArch')}
            </span>
            <span className="text-body-bold font-body-bold text-default-font capitalize">
              {getArchLabel(caseData.treatment_arch)}
            </span>
          </div>

          {/* Aligner Material */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <span className="text-caption font-caption text-subtext-color uppercase">
              {t('caseSubmit.treatmentOptions.alignerMaterial')}
            </span>
            <span className="text-body-bold font-body-bold text-default-font">
              {caseData.aligner_material || t('casePage.notSpecified')}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-neutral-border" />

      {/* Midline Analysis Section */}
      <div className="w-full">
        <span className="text-body-bold font-body-bold text-default-font mb-3 block">
          {t('casePage.midlineAnalysis')}
        </span>
        <div className="flex flex-wrap items-start gap-8">
          {/* Upper Midline */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className="text-caption font-caption text-subtext-color uppercase">
              {t('caseSubmit.diagnosis.upperMidline')}
            </span>
            <span className="text-body-bold font-body-bold text-default-font">
              {getMidlineLabel(caseData.upper_midline)}
              {caseData.upper_midline_shift && (
                <span className="ml-2 text-body font-body text-subtext-color">
                  ({caseData.upper_midline_shift} {t('casePage.mm')})
                </span>
              )}
            </span>
          </div>

          {/* Lower Midline */}
          <div className="flex flex-col gap-1 min-w-[200px]">
            <span className="text-caption font-caption text-subtext-color uppercase">
              {t('caseSubmit.diagnosis.lowerMidline')}
            </span>
            <span className="text-body-bold font-body-bold text-default-font">
              {getMidlineLabel(caseData.lower_midline)}
              {caseData.lower_midline_shift && (
                <span className="ml-2 text-body font-body text-subtext-color">
                  ({caseData.lower_midline_shift} {t('casePage.mm')})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-neutral-border" />

      {/* Occlusal Relationship Section */}
      <div className="w-full">
        <span className="text-body-bold font-body-bold text-default-font mb-3 block">
          {t('casePage.occlusalRelationship')}
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Canine Relationship */}
          <div className="flex flex-col gap-3">
            <span className="text-body font-body text-default-font">
              {t('caseSubmit.diagnosis.canineRelationship')}
            </span>
            <div className="flex flex-col gap-2 pl-4 border-l-2 border-neutral-border">
              <div className="flex items-center justify-start gap-2">
                <span className="text-caption font-caption text-subtext-color">
                  {t('caseSubmit.diagnosis.rightSide')}:
                </span>
                <span className="text-body-bold font-body-bold text-default-font">
                  {getClassLabel(caseData.canine_right_class)}
                </span>
              </div>
              <div className="flex items-center justify-start gap-2">
                <span className="text-caption font-caption text-subtext-color">
                  {t('caseSubmit.diagnosis.leftSide')}:
                </span>
                <span className="text-body-bold font-body-bold text-default-font">
                  {getClassLabel(caseData.canine_left_class)}
                </span>
              </div>
            </div>
          </div>

          {/* Molar Relationship */}
          <div className="flex flex-col gap-3">
            <span className="text-body font-body text-default-font">
              {t('caseSubmit.diagnosis.molarRelationship')}
            </span>
            <div className="flex flex-col gap-2 pl-4 border-l-2 border-neutral-border">
              <div className="flex items-center justify-start gap-2">
                <span className="text-caption font-caption text-subtext-color">
                  {t('caseSubmit.diagnosis.rightSide')}:
                </span>
                <span className="text-body-bold font-body-bold text-default-font">
                  {getClassLabel(caseData.molar_right_class)}
                </span>
              </div>
              <div className="flex items-center justify-start gap-2">
                <span className="text-caption font-caption text-subtext-color">
                  {t('caseSubmit.diagnosis.leftSide')}:
                </span>
                <span className="text-body-bold font-body-bold text-default-font">
                  {getClassLabel(caseData.molar_left_class)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Notes Section - Only show if notes exist */}
      {/*
      {caseData.user_note && (
        <>
          <div className="w-full border-t border-neutral-border" />
          <div className="w-full">
            <span className="text-body-bold font-body-bold text-default-font mb-2 block">
              {t('caseSubmit.diagnosis.additionalNotes')}
            </span>
            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-4 border border-neutral-border">
              <p className="text-body font-body text-default-font whitespace-pre-wrap">
                {caseData.user_note}
              </p>
            </div>
          </div>
        </>
      )}
      */}
    </div>
  );
};

export default TreatmentDetails;
