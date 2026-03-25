import React from 'react';
import { useTranslation } from 'react-i18next';
import RadioGroup from '../RadioGroup';

const TreatmentOptionsForm = ({ formData, handleChange }) => {
  const { t } = useTranslation();

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
    </div>
  );
};

export default TreatmentOptionsForm;