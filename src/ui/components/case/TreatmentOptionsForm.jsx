import React from 'react';
import RadioGroup from '../RadioGroup';

const TreatmentOptionsForm = ({ formData, handleChange, alignerMaterials }) => {
  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      {/* Treatment Arch Selection */}
      <div className="w-full">
        <RadioGroup
          label="Treatment Arch"
          name="treatmentArch"
          options={[
            { label: 'Upper arch', value: 'upper' },
            { label: 'Lower arch', value: 'lower' },
            { label: 'Both arches', value: 'both' },
          ]}
          selectedValue={formData.treatmentArch}
          onChange={handleChange}
        />
      </div>

      {/* Aligner Material Selection */}
      <div className="flex w-full items-start gap-4">
        <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
          <RadioGroup
            label="Preferred Aligner Material"
            name="alignerMaterial"
            options={alignerMaterials.map((mat) => ({
              label: `${mat.name}.`,
              value: mat.name,
            }))}
            selectedValue={formData.alignerMaterial}
            onChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
};

export default TreatmentOptionsForm;
