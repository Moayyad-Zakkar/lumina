import React, { useState, useEffect } from 'react';
import { FeatherX, FeatherSave } from '@subframe/core';
import { Button } from '../Button';

// Dialog component for IPR input
const IPRChartDialog = ({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  caseId,
}) => {
  // Initialize IPR data - 31 spaces (between 32 teeth)
  // Upper: spaces 1-2, 2-3, ..., 15-16 (15 spaces)
  // Lower: spaces 32-31, 31-30, ..., 18-17 (15 spaces)
  // Plus one space between 16-17 (upper to lower midline) if needed

  const [iprData, setIprData] = useState(() => {
    const initialIpr = {};
    // Upper jaw spaces (1-15)
    for (let i = 1; i <= 15; i++) {
      initialIpr[`${i}-${i + 1}`] = initialData[`${i}-${i + 1}`] || '';
    }
    // Lower jaw spaces (17-31)
    for (let i = 17; i <= 31; i++) {
      initialIpr[`${i}-${i + 1}`] = initialData[`${i}-${i + 1}`] || '';
    }
    return initialIpr;
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setIprData((prevData) => ({ ...prevData, ...initialData }));
    }
  }, [initialData]);

  const handleInputChange = (space, value) => {
    // Allow empty or valid decimal numbers up to 2 decimal places
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setIprData((prev) => ({ ...prev, [space]: value }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Filter out empty values
      const filteredData = Object.entries(iprData).reduce(
        (acc, [key, value]) => {
          if (
            value !== '' &&
            value !== '0' &&
            value !== '0.0' &&
            value !== '0.00'
          ) {
            acc[key] = parseFloat(value);
          }
          return acc;
        },
        {}
      );

      await onSave(filteredData);
      onClose();
    } catch (error) {
      console.error('Error saving IPR data:', error);
      alert('Failed to save IPR data. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderToothSpace = (tooth1, tooth2, isUpper) => {
    const space = `${tooth1}-${tooth2}`;
    return (
      <div
        key={space}
        className="flex flex-col items-center gap-1"
        style={{ width: '48px' }}
      >
        {isUpper ? (
          <div className="text-xs text-gray-500 font-medium">
            {tooth1}↔{tooth2}
          </div>
        ) : (
          <div className="text-xs text-gray-500 font-medium">
            {tooth2}↔{tooth1}
          </div>
        )}

        <input
          type="text"
          inputMode="decimal"
          value={iprData[space] || ''}
          onChange={(e) => handleInputChange(space, e.target.value)}
          placeholder="0.0"
          className="w-full px-2 py-1 text-sm text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="text-xs text-gray-400">mm</div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">IPR Chart</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enter interproximal reduction values in millimeters for each space
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={saving}
          >
            <FeatherX className="w-4 h-4 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col items-center gap-12">
            {/* Upper Jaw */}
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                Upper Jaw (Maxilla)
              </h3>
              <div className="flex justify-center" style={{ gap: '4px' }}>
                {[...Array(15)].map((_, i) => {
                  const tooth1 = i + 1;
                  const tooth2 = i + 2;
                  return renderToothSpace(tooth1, tooth2, true);
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-gray-300"></div>

            {/* Lower Jaw */}
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                Lower Jaw (Mandible)
              </h3>
              <div className="flex justify-center" style={{ gap: '4px' }}>
                {[...Array(15)].map((_, i) => {
                  const tooth1 = 32 - i;
                  const tooth2 = 31 - i;
                  return renderToothSpace(tooth2, tooth1, false);
                })}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-brand-50 rounded-lg">
            <h4 className="text-body-bold font-body-bold text-default-font mb-2">
              Instructions:
            </h4>
            <ul className="text-body font-body text-default-font space-y-1 list-disc list-inside">
              <li>Enter IPR values in millimeters (e.g., 0.2, 0.5)</li>
              <li>Leave fields empty for spaces with no IPR</li>
              <li>Click Save to store the IPR chart with the treatment plan</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <Button
            variant="neutral-secondary"
            onClick={onClose}
            disabled={saving}
            className="w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="brand-primary"
            icon={<FeatherSave />}
            onClick={handleSave}
            disabled={saving}
            className="w-auto"
          >
            {saving ? 'Saving...' : 'Save IPR Chart'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IPRChartDialog;
