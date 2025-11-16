import { FeatherAlertTriangle, FeatherX } from '@subframe/core';
import React, { useState } from 'react';
import { Button } from './Button';

const DeclineCaseDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [declineReason, setDeclineReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!declineReason.trim()) {
      setError('Please provide a reason for declining this case.');
      return;
    }

    onConfirm(declineReason.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      setDeclineReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FeatherAlertTriangle className="w-4 h-4 text-red-600" />
              </div>
              <h2 className="text-heading-3 font-heading-3 text-default-font">
                Decline Case
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FeatherX className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-body font-body text-neutral-700 mb-4">
              Please provide a reason for declining this case. This will help
              the doctors in their other cases.
            </p>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="declineReason"
                className="text-body-bold font-body-bold text-default-font"
              >
                Decline Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                id="declineReason"
                value={declineReason}
                onChange={(e) => {
                  setDeclineReason(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter the reason for declining this case..."
                rows={4}
                disabled={isLoading}
                className="w-full px-3 py-2 text-body font-body text-default-font bg-default-background border border-neutral-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical min-h-[100px] placeholder:text-subtext-color disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {error && (
                <span className="text-caption font-caption text-red-600">
                  {error}
                </span>
              )}
              {/*<span className="text-caption font-caption text-subtext-color">
                This information will be recorded and may be shared with
                relevant team members.
              </span>*/}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-neutral-200">
            <Button
              variant="neutral-secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive-primary"
              onClick={handleConfirm}
              disabled={isLoading || !declineReason.trim()}
            >
              {isLoading ? 'Declining...' : 'Confirm Decline'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DeclineCaseDialog;
