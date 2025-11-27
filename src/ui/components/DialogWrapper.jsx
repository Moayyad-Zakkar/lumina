import React from 'react';
import { FeatherX } from '@subframe/core';

const DialogWrapper = ({ 
  isOpen, 
  onClose, 
  title, 
  description, 
  icon, 
  iconBgColor = 'bg-brand-100',
  iconColor = 'text-brand-600',
  maxWidth = 'max-w-[640px]',
  children,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!loading ? onClose : undefined}
      />

      {/* Dialog Content */}
      <div className={`relative bg-white rounded-lg shadow-xl w-full mx-4 p-6 ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className={`w-8 h-8 ${iconBgColor} rounded-full flex items-center justify-center flex-shrink-0`}>
              {React.cloneElement(icon, { className: `w-4 h-4 ${iconColor}` })}
            </div>

            <div className="flex-1">
              <h3 className="text-heading-3 font-heading-3 text-default-font">
                {title}
              </h3>
              {description && (
                <p className="mt-1 text-body font-body text-subtext-color">
                  {description}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <FeatherX className="w-6 h-6" />
            </button>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

export default DialogWrapper;