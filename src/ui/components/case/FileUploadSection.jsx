import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from '../Alert';

const FileUploadSection = ({ formData, handleChange }) => {
  const { t } = useTranslation();

  return (
    <div className="flex w-full flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 pt-4 pb-6 shadow-sm">
      <span className="text-heading-3 font-heading-3 text-default-font">
        {t('caseSubmit.fileUpload.requiredScans')}
      </span>

      {/* Upload Method Selection */}
      <div className="w-full border-b border-neutral-border pb-4">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-body-bold font-body-bold text-default-font mb-3">
            {t('caseSubmit.fileUpload.uploadMethod')}
          </legend>
          <label className="flex items-center gap-3 cursor-pointer text-body font-body text-default-font">
            <input
              type="radio"
              name="uploadMethod"
              value="individual"
              checked={formData.uploadMethod === 'individual'}
              onChange={handleChange}
              className="accent-blue-600 w-4 h-4"
            />
            <span>{t('caseSubmit.fileUpload.individualFiles')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-body font-body text-default-font">
            <input
              type="radio"
              name="uploadMethod"
              value="compressed"
              checked={formData.uploadMethod === 'compressed'}
              onChange={handleChange}
              className="accent-blue-600 w-4 h-4"
            />
            <span>{t('caseSubmit.fileUpload.compressedArchive')}</span>
          </label>
        </fieldset>
      </div>

      {formData.uploadMethod === 'individual' && (
        <>
          <Alert
            title={t('caseSubmit.fileUpload.individualTitle')}
            description={t('caseSubmit.fileUpload.individualDescription')}
          />

          <div>
            <label
              htmlFor="upperJawScan"
              className="block text-sm font-medium text-gray-700"
            >
              {t('caseSubmit.fileUpload.upperJawLabel')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="upperJawScan"
              name="upperJawScan"
              accept=".stl,.obj,.ply"
              onChange={handleChange}
              required={formData.uploadMethod === 'individual'}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
            />
          </div>

          <div>
            <label
              htmlFor="lowerJawScan"
              className="block text-sm font-medium text-gray-700"
            >
              {t('caseSubmit.fileUpload.lowerJawLabel')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="lowerJawScan"
              name="lowerJawScan"
              accept=".stl,.obj,.ply"
              onChange={handleChange}
              required={formData.uploadMethod === 'individual'}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
            />
          </div>

          <div>
            <label
              htmlFor="biteScan"
              className="block text-sm font-medium text-gray-700"
            >
              {t('caseSubmit.fileUpload.biteScanLabel')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="biteScan"
              name="biteScan"
              accept=".stl,.obj,.ply"
              onChange={handleChange}
              required={formData.uploadMethod === 'individual'}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
            />
          </div>
        </>
      )}

      {formData.uploadMethod === 'compressed' && (
        <>
          <Alert
            title={t('caseSubmit.fileUpload.compressedTitle')}
            description={t('caseSubmit.fileUpload.compressedDescription')}
          />

          <div>
            <label
              htmlFor="compressedScans"
              className="block text-sm font-medium text-gray-700"
            >
              {t('caseSubmit.fileUpload.compressedLabel')}{' '}
              <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              id="compressedScans"
              name="compressedScans"
              accept=".zip,.rar,.7z"
              onChange={handleChange}
              required={formData.uploadMethod === 'compressed'}
              className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:rounded-md file:border-0
              file:text-sm file:font-medium
              file:bg-sky-50 file:text-sky-700
              hover:file:bg-sky-100"
            />
          </div>
        </>
      )}

      {/* Additional Files - Always Available */}
      <div className="pt-4 border-t border-neutral-border">
        <label
          htmlFor="additionalFiles"
          className="block text-sm font-medium text-gray-700"
        >
          {t('caseSubmit.fileUpload.additionalFiles')}
        </label>
        <input
          type="file"
          id="additionalFiles"
          name="additionalFiles"
          multiple
          accept=".stl,.obj,.ply,.pdf,.jpg,.png"
          onChange={handleChange}
          className="mt-1 block w-full text-sm text-gray-500
          file:mr-4 file:rounded-md file:border-0
          file:text-sm file:font-medium
          file:bg-sky-50 file:text-sky-700
          hover:file:bg-sky-100"
        />
        {formData.additionalFiles.length > 0 && (
          <div className="mt-2 text-sm text-gray-500">
            {t('caseSubmit.fileUpload.filesSelected', {
              count: formData.additionalFiles.length,
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;
