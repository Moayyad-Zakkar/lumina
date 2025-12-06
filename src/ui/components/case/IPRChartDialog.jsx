import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FeatherX, FeatherSave } from '@subframe/core';
import { Button } from '../Button';

// Dialog component for IPR input - Mesial and Distal per tooth
const IPRChartDialog = ({
  isOpen,
  onClose,
  onSave,
  initialData = {},
  caseId,
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Initialize IPR data - each tooth has mesial and distal values
  const [iprData, setIprData] = useState(() => {
    const initialIpr = {};
    for (let i = 1; i <= 32; i++) {
      initialIpr[i] = {
        mesial: initialData[i]?.mesial || '',
        distal: initialData[i]?.distal || '',
      };
    }
    return initialIpr;
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (Object.keys(initialData).length > 0) {
      setIprData((prevData) => {
        const updated = { ...prevData };
        Object.keys(initialData).forEach((toothNum) => {
          updated[toothNum] = {
            mesial: initialData[toothNum]?.mesial || '',
            distal: initialData[toothNum]?.distal || '',
          };
        });
        return updated;
      });
    }
  }, [initialData]);

  const handleInputChange = (toothNum, side, value) => {
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setIprData((prev) => ({
        ...prev,
        [toothNum]: {
          ...prev[toothNum],
          [side]: value,
        },
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const filteredData = {};
      Object.entries(iprData).forEach(([toothNum, values]) => {
        const mesial = values.mesial;
        const distal = values.distal;

        const hasMesial =
          mesial !== '' &&
          mesial !== '0' &&
          mesial !== '0.0' &&
          mesial !== '0.00';
        const hasDistal =
          distal !== '' &&
          distal !== '0' &&
          distal !== '0.0' &&
          distal !== '0.00';

        if (hasMesial || hasDistal) {
          filteredData[toothNum] = {
            mesial: hasMesial ? parseFloat(mesial) : 0,
            distal: hasDistal ? parseFloat(distal) : 0,
          };
        }
      });

      await onSave(filteredData);
      onClose();
    } catch (error) {
      console.error('Error saving IPR data:', error);
      alert(
        t('adminTreatmentPlan.toast.iprFailed') ||
          'Failed to save IPR data. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderTooth = (toothNum, isUpper) => {
    return (
      <div
        key={toothNum}
        className="flex flex-col items-center gap-1"
        style={{ width: '48px' }}
      >
        <div className="text-xs font-bold text-gray-700 mb-1">#{toothNum}</div>

        {/* Mesial input */}
        <div className="flex flex-col items-center w-full">
          <div className="text-[10px] text-gray-500 font-medium mb-0.5">M</div>
          <input
            type="text"
            inputMode="decimal"
            value={iprData[toothNum]?.mesial || ''}
            onChange={(e) =>
              handleInputChange(toothNum, 'mesial', e.target.value)
            }
            placeholder="0.0"
            className="w-full px-1 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Distal input */}
        <div className="flex flex-col items-center w-full">
          <div className="text-[10px] text-gray-500 font-medium mb-0.5">D</div>
          <input
            type="text"
            inputMode="decimal"
            value={iprData[toothNum]?.distal || ''}
            onChange={(e) =>
              handleInputChange(toothNum, 'distal', e.target.value)
            }
            placeholder="0.0"
            className="w-full px-1 py-1 text-xs text-center border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-[10px] text-gray-400 mt-0.5">
          {t('casePage.mm')}
        </div>
      </div>
    );
  };

  // Helper to render teeth in correct order based on language direction
  const renderUpperTeeth = () => {
    const teeth = [...Array(16)].map((_, i) => {
      const toothNum = i + 1;
      return renderTooth(toothNum, true);
    });
    // Always keep LTR order for teeth (1-16 from left to right)
    return teeth;
  };

  const renderLowerTeeth = () => {
    const teeth = [...Array(16)].map((_, i) => {
      const toothNum = 32 - i;
      return renderTooth(toothNum, false);
    });
    // Always keep LTR order for teeth (32-17 from left to right)
    return teeth;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isRTL ? '' : 'flex-row-reverse'
          }`}
        >
          <div className={isRTL ? 'text-right' : ''}>
            <h2 className="text-2xl font-semibold text-gray-900">
              {t('adminTreatmentPlan.iprChart')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('iprChart.instructions.enterValues')}
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
                {t('iprChart.upperJaw')}
              </h3>
              <div
                className="flex justify-center"
                style={{ gap: '4px', direction: 'ltr' }}
              >
                {renderUpperTeeth()}
              </div>
            </div>

            {/* Divider */}
            <div className="w-full border-t border-gray-300"></div>

            {/* Lower Jaw */}
            <div className="w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                {t('iprChart.lowerJaw')}
              </h3>
              <div
                className="flex justify-center"
                style={{ gap: '4px', direction: 'ltr' }}
              >
                {renderLowerTeeth()}
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div
            className={`mt-8 p-4 bg-brand-50 rounded-lg ${
              isRTL ? 'text-right' : ''
            }`}
          >
            <h4 className="text-body-bold font-body-bold text-default-font mb-2">
              {t('iprChart.instructions.title')}
            </h4>
            <ul
              className={`text-body font-body text-default-font space-y-1 list-disc ${
                isRTL ? 'list-inside mr-4' : 'list-inside'
              }`}
            >
              <li>{t('iprChart.instructions.enterMillimeters')}</li>
              <li>{t('iprChart.instructions.leaveEmpty')}</li>
              <li>{t('iprChart.instructions.combineValues')}</li>
              <li>{t('iprChart.instructions.clickSave')}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex items-center gap-3 p-6 border-t bg-gray-50 ${
            isRTL ? 'flex-row-reverse' : 'justify-end'
          }`}
        >
          <Button
            variant="neutral-secondary"
            onClick={onClose}
            disabled={saving}
            className="w-auto"
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="brand-primary"
            icon={<FeatherSave />}
            onClick={handleSave}
            disabled={saving}
            className="w-auto"
          >
            {saving ? t('common.saving') : t('iprChart.saveButton')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default IPRChartDialog;
