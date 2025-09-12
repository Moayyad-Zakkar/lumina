import React from 'react';
import { TextField } from '../TextField';
import RadioGroup from '../RadioGroup';

const DiagnosisForm = ({ formData, handleChange }) => {
  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        Basic Diagnosis
      </span>

      {/* Upper Midline */}
      <div className="w-full">
        <div className="flex flex-col gap-4">
          <RadioGroup
            label="Upper Midline"
            name="upperMidline"
            options={[
              { label: 'Centered', value: 'centered' },
              { label: 'Shifted right', value: 'shifted_right' },
              { label: 'Shifted left', value: 'shifted_left' },
            ]}
            selectedValue={formData.upperMidline}
            onChange={handleChange}
          />
          {(formData.upperMidline === 'shifted_right' ||
            formData.upperMidline === 'shifted_left') && (
            <div className="ml-6">
              <TextField
                className="h-auto w-48 flex-none"
                label="Shift Amount"
                helpText="Enter shift in millimeters"
              >
                <TextField.Input
                  placeholder="e.g., 2.5"
                  type="number"
                  step="0.1"
                  id="upperMidlineShift"
                  name="upperMidlineShift"
                  value={formData.upperMidlineShift}
                  onChange={handleChange}
                />
              </TextField>
            </div>
          )}
        </div>
      </div>

      {/* Lower Midline */}
      <div className="w-full">
        <div className="flex flex-col gap-4">
          <RadioGroup
            label="Lower Midline"
            name="lowerMidline"
            options={[
              { label: 'Centered', value: 'centered' },
              { label: 'Shifted right', value: 'shifted_right' },
              { label: 'Shifted left', value: 'shifted_left' },
            ]}
            selectedValue={formData.lowerMidline}
            onChange={handleChange}
          />
          {(formData.lowerMidline === 'shifted_right' ||
            formData.lowerMidline === 'shifted_left') && (
            <div className="ml-6">
              <TextField
                className="h-auto w-48 flex-none"
                label="Shift Amount"
                helpText="Enter shift in millimeters"
              >
                <TextField.Input
                  placeholder="e.g., 1.8"
                  type="number"
                  step="0.1"
                  id="lowerMidlineShift"
                  name="lowerMidlineShift"
                  value={formData.lowerMidlineShift}
                  onChange={handleChange}
                />
              </TextField>
            </div>
          )}
        </div>
      </div>

      {/* Canine Relationship */}
      <div className="w-full">
        <span className="text-body-bold font-body-bold text-default-font mb-4 block">
          Canine Relationship
        </span>
        <div className="flex gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-body font-body text-default-font">
              Right Side
            </span>
            <select
              name="canineRightClass"
              value={formData.canineRightClass}
              onChange={handleChange}
              className="px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select class</option>
              <option value="class_i">Class I</option>
              <option value="class_ii">Class II</option>
              <option value="class_iii">Class III</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-body font-body text-default-font">
              Left Side
            </span>
            <select
              name="canineLeftClass"
              value={formData.canineLeftClass}
              onChange={handleChange}
              className="px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select class</option>
              <option value="class_i">Class I</option>
              <option value="class_ii">Class II</option>
              <option value="class_iii">Class III</option>
            </select>
          </div>
        </div>
      </div>

      {/* Molar Relationship */}
      <div className="w-full">
        <span className="text-body-bold font-body-bold text-default-font mb-4 block">
          Molar Relationship
        </span>
        <div className="flex gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-body font-body text-default-font">
              Right Side
            </span>
            <select
              name="molarRightClass"
              value={formData.molarRightClass}
              onChange={handleChange}
              className="px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select class</option>
              <option value="class_i">Class I</option>
              <option value="class_ii">Class II</option>
              <option value="class_iii">Class III</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-body font-body text-default-font">
              Left Side
            </span>
            <select
              name="molarLeftClass"
              value={formData.molarLeftClass}
              onChange={handleChange}
              className="px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select class</option>
              <option value="class_i">Class I</option>
              <option value="class_ii">Class II</option>
              <option value="class_iii">Class III</option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="w-full">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="userNote"
            className="text-body-bold font-body-bold text-default-font"
          >
            Additional Notes
          </label>
          <textarea
            id="userNote"
            name="userNote"
            value={formData.userNote}
            onChange={handleChange}
            placeholder="Enter any special instructions, patient history, or additional details..."
            rows={4}
            className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px] placeholder:text-subtext-color"
          />
          <span className="text-caption font-caption text-subtext-color">
            Add any additional information or special instructions for this case
          </span>
        </div>
      </div>
    </div>
  );
};

export default DiagnosisForm;
