import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import RadioGroup from '../RadioGroup';
import DialogWrapper from '../DialogWrapper'; // Import the dialog
import { FeatherInfo } from '@subframe/core'; // Assuming Feather icons are available

const TreatmentOptionsForm = ({ formData, handleChange, alignerMaterials }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isInfoDialogOpen, setIsInfoDialogOpen] = useState(false);

  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      {/* Treatment Arch Selection */}
      <div className="w-full">
        <RadioGroup
          label={t('caseSubmit.treatmentOptions.treatmentArch')}
          name="treatmentArch"
          options={[
            {
              label: t('caseSubmit.treatmentOptions.upperArch'),
              value: 'upper',
            },
            {
              label: t('caseSubmit.treatmentOptions.lowerArch'),
              value: 'lower',
            },
            {
              label: t('caseSubmit.treatmentOptions.bothArches'),
              value: 'both',
            },
          ]}
          selectedValue={formData.treatmentArch}
          onChange={handleChange}
        />
      </div>

      {/* Aligner Material Selection */}
      <div className="flex w-full flex-col items-start gap-2">
        <div className="flex items-center gap-2">
          <span className="text-body-bold font-body-bold text-default-font">
            {t('caseSubmit.treatmentOptions.alignerMaterial')}
          </span>
          <button
            type="button"
            onClick={() => setIsInfoDialogOpen(true)}
            className="flex items-center gap-1 text-caption font-caption text-brand-600 hover:text-brand-700 transition-colors"
          >
            <FeatherInfo className="w-3 h-3" />
            {t('common.learnMore', 'Learn more about systems')}
          </button>
        </div>

        <div className="flex w-full items-start gap-4">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
            <RadioGroup
              // Passing null as label because we handled it above to include the "Learn More" link
              label={null}
              name="alignerMaterial"
              options={alignerMaterials.map((mat) => ({
                label: `${mat.name}`,
                value: mat.name,
              }))}
              selectedValue={formData.alignerMaterial}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Learn More Dialog */}
      <DialogWrapper
        isOpen={isInfoDialogOpen}
        onClose={() => setIsInfoDialogOpen(false)}
        title={t(
          'caseSubmit.treatmentOptions.materialDetails',
          'Aligner Systems & Pricing'
        )}
        description={t(
          'caseSubmit.treatmentOptions.materialDesc',
          'Compare our available aligner materials and features.'
        )}
        icon={<FeatherInfo />}
      >
        <div className="flex flex-col gap-4 mt-2">
          {alignerMaterials.map((mat) => (
            <div
              key={mat.id}
              className="flex flex-col gap-1 p-4 rounded-md border border-neutral-border bg-neutral-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-body-bold font-body-bold text-default-font">
                  {mat.name}
                </span>
                <span className="text-body-bold font-body-bold text-brand-600">
                  ${Number(mat.price || 0).toFixed(2)}/
                  {t('caseSubmit.treatmentOptions.perAligner')}
                </span>
              </div>
              <p
                className="text-caption font-caption text-subtext-color"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                {(isRTL ? mat.description_ar : mat.description_en) || ''}
              </p>
            </div>
          ))}

          {alignerMaterials.length === 0 && (
            <div className="text-center py-6 text-subtext-color">
              {t('common.noRecords', 'No materials found.')}
            </div>
          )}
        </div>
      </DialogWrapper>
    </div>
  );
};

export default TreatmentOptionsForm;
