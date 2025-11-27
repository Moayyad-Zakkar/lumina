import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherCheck } from '@subframe/core';
import { Button } from './Button';
import DialogWrapper from './DialogWrapper';
import AlertBox from './AlertBox';
import StarRating from './StarRating';

const SatisfactionDialog = ({
  isOpen,
  onClose,
  onSubmit,
  satisfactionData,
  onRatingChange,
  onMessageChange,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={t('casePage.satisfaction.dialog.title')}
      description={t('casePage.satisfaction.dialog.description')}
      icon={<FeatherCheck />}
      loading={loading}
      maxWidth="max-w-[540px]"
    >
      {error && (
        <AlertBox variant="error" title={t('common.error')} message={error} />
      )}

      {/* Rating Section */}
      <div className="border border-neutral-border rounded-md p-4">
        <label className="block text-body-bold font-body-bold text-default-font mb-3">
          {t('casePage.satisfaction.dialog.ratingLabel')}{' '}
          <span className="text-red-500">*</span>
        </label>
        <div className="flex justify-center">
          <StarRating
            rating={satisfactionData.rating}
            onRatingChange={onRatingChange}
            disabled={loading}
          />
        </div>
      </div>

      {/* Comments Section */}
      <div className="border border-neutral-border rounded-md p-4">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="satisfactionMessage"
            className="text-body-bold font-body-bold text-default-font"
          >
            {t('casePage.satisfaction.dialog.commentsLabel')}
          </label>
          <p className="text-body font-body text-subtext-color -mt-1 mb-2">
            {t('casePage.satisfaction.dialog.commentsHelp')}
          </p>
          <textarea
            id="satisfactionMessage"
            value={satisfactionData.message}
            onChange={(e) => onMessageChange(e.target.value)}
            placeholder={t('casePage.satisfaction.dialog.commentsPlaceholder')}
            rows={4}
            disabled={loading}
            className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-vertical min-h-[100px] placeholder:text-subtext-color disabled:opacity-50 disabled:cursor-not-allowed"
          />
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
            ? t('casePage.satisfaction.dialog.submitting')
            : t('casePage.satisfaction.dialog.submitButton')}
        </Button>
      </div>
    </DialogWrapper>
  );
};

export default SatisfactionDialog;
