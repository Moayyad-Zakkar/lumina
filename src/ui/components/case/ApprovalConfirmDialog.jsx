import React from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherCheck, FeatherX } from '@subframe/core';
import { Button } from '../Button';

const ApprovalConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={!isLoading ? onClose : undefined}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FeatherCheck className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-heading-3 font-heading-3 text-default-font">
                {t('casePage.dialogs.approval.title')}
              </h2>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FeatherX className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-body font-body text-neutral-700">
              {t('casePage.dialogs.approval.message')}
            </p>
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-body-bold font-body-bold text-green-800">
                {t('casePage.dialogs.approval.lockMessage')}
              </p>
              <p className="text-body font-body text-green-700 mt-1">
                {t('casePage.dialogs.approval.productionMessage')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
            <Button
              variant="neutral-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="brand-primary"
              icon={<FeatherCheck />}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading
                ? t('casePage.dialogs.approval.approving')
                : t('casePage.dialogs.approval.confirmButton')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ApprovalConfirmDialog;
