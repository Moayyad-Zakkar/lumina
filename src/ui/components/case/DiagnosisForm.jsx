import React from 'react';
import { useTranslation } from 'react-i18next';
import { TextField } from '../TextField';
import RadioGroup from '../RadioGroup';

const DiagnosisForm = ({ formData, handleChange, isAdmin }) => {
  const { t } = useTranslation();

  // Helper to render the red asterisk if the user is not an admin
  const RequiredAsterisk = () => {
    if (isAdmin) return null;
    return (
      <span
        className="text-red-500 ml-1 font-bold"
        title={t('common.required')}
      >
        *
      </span>
    );
  };

  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-gray-200 bg-white px-6 pt-4 pb-6 shadow-sm">
      <span className="text-xl font-bold text-gray-800">
        {t('caseSubmit.diagnosis.title')}
      </span>

      {/* Chief Complaint */}
      <div className="w-full">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="chiefComplaint"
            className="text-sm font-bold text-gray-700"
          >
            {t('caseSubmit.diagnosis.chiefComplaint')}
          </label>
          <textarea
            id="chiefComplaint"
            name="chiefComplaint"
            value={formData.chiefComplaint}
            onChange={handleChange}
            placeholder={t('caseSubmit.diagnosis.chiefComplaintPlaceholder')}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[80px]"
          />
          <span className="text-xs text-gray-400">
            {t('caseSubmit.diagnosis.chiefComplaintHelp')}
          </span>
        </div>
      </div>

      {/* Upper Midline */}
      <div className="w-full">
        <div className="flex flex-col gap-4">
          <RadioGroup
            label={
              <span className="flex items-center">
                {t('caseSubmit.diagnosis.upperMidline')}
                <RequiredAsterisk />
              </span>
            }
            name="upperMidline"
            options={[
              { label: t('caseSubmit.diagnosis.centered'), value: 'centered' },
              {
                label: t('caseSubmit.diagnosis.shiftedRight'),
                value: 'shifted_right',
              },
              {
                label: t('caseSubmit.diagnosis.shiftedLeft'),
                value: 'shifted_left',
              },
            ]}
            selectedValue={formData.upperMidline}
            onChange={handleChange}
          />
          {(formData.upperMidline === 'shifted_right' ||
            formData.upperMidline === 'shifted_left') && (
            <div className="ml-6">
              <TextField
                className="h-auto w-48 flex-none"
                label={
                  <span className="flex items-center">
                    {t('caseSubmit.diagnosis.shiftAmount')}
                    <RequiredAsterisk />
                  </span>
                }
                helpText={t('caseSubmit.diagnosis.shiftAmountHelp')}
              >
                <TextField.Input
                  placeholder={t('caseSubmit.diagnosis.shiftAmountPlaceholder')}
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
            label={
              <span className="flex items-center">
                {t('caseSubmit.diagnosis.lowerMidline')}
                <RequiredAsterisk />
              </span>
            }
            name="lowerMidline"
            options={[
              { label: t('caseSubmit.diagnosis.centered'), value: 'centered' },
              {
                label: t('caseSubmit.diagnosis.shiftedRight'),
                value: 'shifted_right',
              },
              {
                label: t('caseSubmit.diagnosis.shiftedLeft'),
                value: 'shifted_left',
              },
            ]}
            selectedValue={formData.lowerMidline}
            onChange={handleChange}
          />
          {(formData.lowerMidline === 'shifted_right' ||
            formData.lowerMidline === 'shifted_left') && (
            <div className="ml-6">
              <TextField
                className="h-auto w-48 flex-none"
                label={
                  <span className="flex items-center">
                    {t('caseSubmit.diagnosis.shiftAmount')}
                    <RequiredAsterisk />
                  </span>
                }
                helpText={t('caseSubmit.diagnosis.shiftAmountHelp')}
              >
                <TextField.Input
                  placeholder={t('caseSubmit.diagnosis.shiftAmountPlaceholder')}
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
        <span className="text-sm font-bold text-gray-700 mb-4 block">
          {t('caseSubmit.diagnosis.canineRelationship')}
          <RequiredAsterisk />
        </span>
        <div className="flex gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600">
              {t('caseSubmit.diagnosis.rightSide')}
            </span>
            <select
              name="canineRightClass"
              value={formData.canineRightClass}
              onChange={handleChange}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">{t('caseSubmit.diagnosis.selectClass')}</option>
              <option value="class_i">
                {t('caseSubmit.diagnosis.classI')}
              </option>
              <option value="class_ii">
                {t('caseSubmit.diagnosis.classII')}
              </option>
              <option value="class_iii">
                {t('caseSubmit.diagnosis.classIII')}
              </option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600">
              {t('caseSubmit.diagnosis.leftSide')}
            </span>
            <select
              name="canineLeftClass"
              value={formData.canineLeftClass}
              onChange={handleChange}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">{t('caseSubmit.diagnosis.selectClass')}</option>
              <option value="class_i">
                {t('caseSubmit.diagnosis.classI')}
              </option>
              <option value="class_ii">
                {t('caseSubmit.diagnosis.classII')}
              </option>
              <option value="class_iii">
                {t('caseSubmit.diagnosis.classIII')}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Molar Relationship */}
      <div className="w-full">
        <span className="text-sm font-bold text-gray-700 mb-4 block">
          {t('caseSubmit.diagnosis.molarRelationship')}
          <RequiredAsterisk />
        </span>
        <div className="flex gap-8">
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600">
              {t('caseSubmit.diagnosis.rightSide')}
            </span>
            <select
              name="molarRightClass"
              value={formData.molarRightClass}
              onChange={handleChange}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">{t('caseSubmit.diagnosis.selectClass')}</option>
              <option value="class_i">
                {t('caseSubmit.diagnosis.classI')}
              </option>
              <option value="class_ii">
                {t('caseSubmit.diagnosis.classII')}
              </option>
              <option value="class_iii">
                {t('caseSubmit.diagnosis.classIII')}
              </option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-600">
              {t('caseSubmit.diagnosis.leftSide')}
            </span>
            <select
              name="molarLeftClass"
              value={formData.molarLeftClass}
              onChange={handleChange}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">{t('caseSubmit.diagnosis.selectClass')}</option>
              <option value="class_i">
                {t('caseSubmit.diagnosis.classI')}
              </option>
              <option value="class_ii">
                {t('caseSubmit.diagnosis.classII')}
              </option>
              <option value="class_iii">
                {t('caseSubmit.diagnosis.classIII')}
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="w-full">
        <div className="flex flex-col gap-2">
          <label htmlFor="userNote" className="text-sm font-bold text-gray-700">
            {t('caseSubmit.diagnosis.additionalNotes')}
          </label>
          <textarea
            id="userNote"
            name="userNote"
            value={formData.userNote}
            onChange={handleChange}
            placeholder={t('caseSubmit.diagnosis.additionalNotesPlaceholder')}
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px]"
          />
          <span className="text-xs text-gray-400">
            {t('caseSubmit.diagnosis.additionalNotesHelp')}
          </span>
        </div>
      </div>
    </div>
  );
};
export default DiagnosisForm;
