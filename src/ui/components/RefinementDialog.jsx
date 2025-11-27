import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherRefreshCw, FeatherCheck } from '@subframe/core';
import { Button } from './Button';
import { Loader } from './Loader';
import RadioGroup from './RadioGroup';
import DialogWrapper from './DialogWrapper';
import AlertBox from './AlertBox';
import FileUploadField from './FileUploadField';

const RefinementDialog = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  alignerMaterials,
  loadingMaterials,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={t('casePage.refinement.dialog.title')}
      description={t('casePage.refinement.dialog.description')}
      icon={<FeatherRefreshCw />}
      loading={loading}
      maxWidth="max-w-[640px]"
    >
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
      <div className="border border-neutral-border rounded-md p-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="reason"
            className="text-body-bold font-body-bold text-default-font"
          >
            {t('casePage.refinement.dialog.reasonLabel')}{' '}
            <span className="text-red-500">*</span>
          </label>
          <p className="text-body font-body text-subtext-color -mt-1 mb-2">
            {t('casePage.refinement.dialog.reasonHelp')}
          </p>
          <textarea
            id="reason"
            value={formData.reason}
            onChange={(e) =>
              onChange({ target: { name: 'reason', value: e.target.value } })
            }
            placeholder={t('casePage.refinement.dialog.reasonPlaceholder')}
            rows={4}
            disabled={loading}
            className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-vertical min-h-[100px] placeholder:text-subtext-color disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* Aligner Material Selection */}
      <div className="border border-neutral-border rounded-md p-4">
        {loadingMaterials ? (
          <div className="flex items-center justify-center py-4">
            <Loader size="small" />
          </div>
        ) : alignerMaterials.length > 0 ? (
          <RadioGroup
            label={t('casePage.refinement.dialog.materialLabel')}
            name="alignerMaterial"
            options={alignerMaterials.map((mat) => ({
              label: `${mat.name} (${mat.price}$/aligner)`,
              value: mat.name,
            }))}
            selectedValue={formData.alignerMaterial}
            onChange={onChange}
          />
        ) : (
          <p className="text-body font-body text-subtext-color">
            {t('casePage.refinement.dialog.noMaterials')}
          </p>
        )}
      </div>

      {/* Upload Method Selection */}
      <div className="border border-neutral-border rounded-md p-4">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-body-bold font-body-bold text-default-font mb-2">
            {t('casePage.refinement.dialog.uploadMethod')}
          </legend>
          <label className="flex items-center gap-3 cursor-pointer text-body font-body text-default-font">
            <input
              type="radio"
              name="uploadMethod"
              value="individual"
              checked={formData.uploadMethod === 'individual'}
              onChange={onChange}
              disabled={loading}
              className="accent-blue-600 w-4 h-4"
            />
            <span>{t('casePage.refinement.dialog.individualFiles')}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer text-body font-body text-default-font">
            <input
              type="radio"
              name="uploadMethod"
              value="compressed"
              checked={formData.uploadMethod === 'compressed'}
              onChange={onChange}
              disabled={loading}
              className="accent-blue-600 w-4 h-4"
            />
            <span>{t('casePage.refinement.dialog.compressedArchive')}</span>
          </label>
        </fieldset>
      </div>

      {/* File Uploads */}
      <div className="border border-neutral-border rounded-md p-4">
        <h4 className="text-body-bold font-body-bold text-default-font mb-4">
          {t('casePage.refinement.dialog.scansRequired')}
        </h4>

        {formData.uploadMethod === 'individual' ? (
          <>
            <AlertBox
              variant="info"
              message={t('casePage.refinement.dialog.individualHelp')}
            />

            <div className="space-y-4 mt-4">
              <FileUploadField
                label={t('casePage.refinement.dialog.upperJawScan')}
                name="upperJawScan"
                accept=".stl,.obj,.ply"
                onChange={onChange}
                disabled={loading}
                required
              />
              <FileUploadField
                label={t('casePage.refinement.dialog.lowerJawScan')}
                name="lowerJawScan"
                accept=".stl,.obj,.ply"
                onChange={onChange}
                disabled={loading}
                required
              />
              <FileUploadField
                label={t('casePage.refinement.dialog.biteScan')}
                name="biteScan"
                accept=".stl,.obj,.ply"
                onChange={onChange}
                disabled={loading}
                required
              />
            </div>
          </>
        ) : (
          <>
            <AlertBox
              variant="info"
              message={t('casePage.refinement.dialog.compressedHelp')}
            />

            <div className="mt-4">
              <FileUploadField
                label={t('casePage.refinement.dialog.compressedLabel')}
                name="compressedScans"
                accept=".zip,.rar,.7z"
                onChange={onChange}
                disabled={loading}
                required
              />
            </div>
          </>
        )}

        {/* Additional Files */}
        <div className="pt-4 mt-4 border-t border-neutral-border">
          <FileUploadField
            label={t('casePage.refinement.dialog.additionalFiles')}
            name="additionalFiles"
            accept=".stl,.obj,.ply,.pdf,.jpg,.png"
            onChange={onChange}
            disabled={loading}
            multiple
          />
          {formData.additionalFiles.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              {t('casePage.refinement.dialog.filesSelected', {
                count: formData.additionalFiles.length,
              })}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-neutral-border">
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
          onClick={onSubmit}
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
