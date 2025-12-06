import React from 'react';
import { toothPaths } from '../../assets/toothPaths';
import { FeatherSlice, FeatherX } from '@subframe/core';
import { useTranslation } from 'react-i18next';

// Reusable Tooth component with IPR values
const ToothWithIPR = ({
  num,
  paths,
  status,
  isUpperJaw,
  iprBefore,
  iprAfter,
}) => {
  const TOOTH_STATUSES = {
    movable: { color: '#00adef' },
    unmovable: { color: '#F44336' },
    missing: { color: '#9E9E9E' },
    note: { color: '#fa9600' },
  };

  const color = TOOTH_STATUSES[status]?.color || '#00adef';

  return (
    <>
      {/* IPR value before tooth (in the gap) */}
      {iprBefore && (
        <div
          className="flex items-center justify-center"
          style={{
            width: '4px', // Match the gap size
            minHeight: '64px',
          }}
        >
          <div
            className="text-xs font-semibold text-orange-600 bg-orange-50 px-1 rounded whitespace-nowrap"
            style={{
              position: 'relative',
              top: isUpperJaw ? '8px' : '-16px',
            }}
          >
            {iprBefore}
          </div>
        </div>
      )}

      {/* Tooth */}
      <div
        className="flex flex-col items-center relative"
        style={{ width: '48px', minHeight: '64px' }}
      >
        {/* SVG Container */}
        <div
          className="flex justify-center mb-1"
          style={{
            width: '48px',
            height: '72px',
            alignItems: isUpperJaw ? 'flex-end' : 'flex-start',
            marginBottom: isUpperJaw ? '10px' : 0,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 21.1 56.7"
            className="w-full h-full"
            fill={color}
            style={{
              maxWidth: '48px',
              maxHeight: '72px',
              display: 'block',
            }}
          >
            {paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        </div>

        {/* Number label */}
        <p
          className="text-xs text-center"
          style={{
            lineHeight: '1',
            width: '100%',
            margin: 0,
          }}
        >
          {num}
        </p>
      </div>

      {/* IPR value after tooth (in the gap) */}
      {iprAfter && (
        <div
          className="flex items-center justify-center"
          style={{
            width: '4px', // Match the gap size
            minHeight: '64px',
          }}
        >
          <div
            className="text-xs font-semibold text-orange-600 bg-orange-50 px-1 rounded whitespace-nowrap"
            style={{
              position: 'relative',
              top: isUpperJaw ? '8px' : '-16px',
            }}
          >
            {iprAfter}
          </div>
        </div>
      )}
    </>
  );
};

const IPRChartViewer = ({
  toothStatus = {},
  iprData = {},
  onClose,
  isOpen,
}) => {
  const handleClose = () => {
    onClose();
  };

  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  // Get single IPR value (for end teeth)
  const getSingleIPR = (toothNum, side) => {
    const toothData = iprData[toothNum];
    if (!toothData) return null;

    const value = toothData[side] || 0;
    if (value > 0) {
      return value % 1 === 0
        ? value.toString()
        : value.toFixed(2).replace(/\.?0+$/, '');
    }
    return null;
  };

  // Calculate combined IPR between two adjacent teeth
  // Pattern for upper jaw: (D)1(M+D)2(M+D)3...(M+D)8(M+M)9(D+M)10...(D+M)16(D)
  // Pattern for lower jaw: (D)17(M+D)18...(M+D)24(M+M)25(D+M)26...(D+M)32(D)
  const getCombinedIPR = (tooth1, tooth2) => {
    const tooth1Data = iprData[tooth1];
    const tooth2Data = iprData[tooth2];

    if (!tooth1Data && !tooth2Data) return null;

    let value = 0;

    // Upper jaw combinations
    if (tooth1 >= 1 && tooth1 <= 16) {
      if (tooth1 === 1 && tooth2 === 2) {
        // (M)1 + (D)2
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.distal || 0);
      } else if (tooth1 >= 2 && tooth1 <= 7 && tooth2 === tooth1 + 1) {
        // (M)N + (D)N+1 for teeth 2-7
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.distal || 0);
      } else if (tooth1 === 8 && tooth2 === 9) {
        // (M)8 + (M)9 - crossing midline
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.mesial || 0);
      } else if (tooth1 >= 9 && tooth1 <= 15 && tooth2 === tooth1 + 1) {
        // (D)N + (M)N+1 for teeth 9-15
        value = (tooth1Data?.distal || 0) + (tooth2Data?.mesial || 0);
      }
    }
    // Lower jaw combinations
    else if (tooth1 >= 17 && tooth1 <= 32) {
      // Display order is 32->17, so we handle tooth1 (higher#) to tooth2 (lower#)
      if (tooth1 === 32 && tooth2 === 31) {
        // (M)32 + (D)31
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.distal || 0);
      } else if (tooth1 >= 26 && tooth1 <= 31 && tooth2 === tooth1 - 1) {
        // (M)N + (D)N-1 for teeth 31-26
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.distal || 0);
      } else if (tooth1 === 25 && tooth2 === 24) {
        // (M)25 + (M)24 - crossing midline
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.mesial || 0);
      } else if (tooth1 >= 18 && tooth1 <= 24 && tooth2 === tooth1 - 1) {
        // (D)N + (M)N-1 for teeth 24-18
        value = (tooth1Data?.distal || 0) + (tooth2Data?.mesial || 0);
      } else if (tooth1 === 18 && tooth2 === 17) {
        // (D)18 + (M)17
        value = (tooth1Data?.distal || 0) + (tooth2Data?.mesial || 0);
      }
    }

    if (value > 0) {
      return value % 1 === 0
        ? value.toString()
        : value.toFixed(2).replace(/\.?0+$/, '');
    }

    return null;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-lg shadow-xl w-auto max-h-[90vh] overflow-y-auto pointer-events-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FeatherSlice className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-heading-3 font-heading-3 text-default-font">
                  {t('adminTreatmentPlan.iprChart')}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {t('iprChart.description')}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100"
            >
              <FeatherX className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {/* Content */}
          <div
            className="p-6 flex flex-col items-center gap-8"
            style={{ direction: 'ltr' }}
          >
            {/* Upper jaw */}
            <div className="flex relative items-center">
              {[...Array(16)].map((_, i) => {
                const num = i + 1;
                const paths = toothPaths[`tooth${num}`] || [];
                const status = toothStatus[num] || 'movable';

                // Determine IPR values based on pattern: (D)1(M+D)2...(M+D)8(M+M)9(D+M)10...(D+M)16(D)
                // Show each IPR value only once - on the LEFT side of the space
                let iprBefore = null;
                let iprAfter = null;

                if (num === 1) {
                  // Tooth 1: (D)1 at start (left)
                  iprBefore = getSingleIPR(1, 'distal');
                  // (M+D)1-2 appears to the right, will be shown as iprBefore of tooth 2
                } else {
                  // Show IPR value to the left of this tooth
                  iprBefore = getCombinedIPR(num - 1, num);
                }

                if (num === 16) {
                  // Tooth 16: (D)16 at end (right)
                  iprAfter = getSingleIPR(16, 'distal');
                }

                return (
                  <ToothWithIPR
                    key={num}
                    num={num}
                    paths={paths}
                    status={status}
                    isUpperJaw={true}
                    iprBefore={iprBefore}
                    iprAfter={iprAfter}
                  />
                );
              })}
            </div>

            {/* Lower jaw */}
            <div className="flex relative items-center">
              {[...Array(16)].map((_, i) => {
                const num = 32 - i;
                const paths = toothPaths[`tooth${num}`] || [];
                const status = toothStatus[num] || 'movable';

                // Pattern: (D)17(M+D)18...(M+D)24(M+M)25(D+M)26...(D+M)32(D)
                // Display order: 32, 31, 30, ..., 17
                // Show each IPR value only once - on the LEFT side of the space
                let iprBefore = null;
                let iprAfter = null;

                if (num === 32) {
                  // Tooth 32: (D)32 at start (left)
                  iprBefore = getSingleIPR(32, 'distal');
                  // (M+D)32-31 appears to the right, will be shown as iprBefore of tooth 31
                } else {
                  // Show IPR value to the left of this tooth
                  iprBefore = getCombinedIPR(num + 1, num);
                }

                if (num === 17) {
                  // Tooth 17: (D)17 at end (right)
                  iprAfter = getSingleIPR(17, 'distal');
                }

                return (
                  <ToothWithIPR
                    key={num}
                    num={num}
                    paths={paths}
                    status={status}
                    isUpperJaw={false}
                    iprBefore={iprBefore}
                    iprAfter={iprAfter}
                  />
                );
              })}
            </div>

            {/* Legend */}
            <div
              className={`flex items-center gap-2 text-sm text-gray-600 bg-orange-50 px-4 py-2 rounded ${
                isRTL ? 'flex-row-reverse' : ''
              }`}
            >
              <div className="w-3 h-3 bg-orange-600 rounded"></div>
              <span>{t('iprChart.legend')}</span>
            </div>
            {/*
            <div className="flex flex-col gap-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                <div className="w-3 h-3 bg-orange-600 rounded"></div>
                <span>IPR (Interproximal Reduction) in millimeters</span>
              </div>

              </div>

*/}
          </div>
        </div>
      </div>
    </>
  );
};

/* -------------------------------------------------------
   Printable IPR Chart Component (simplified for printing)
------------------------------------------------------- */
export const PrintableIPRChart = ({ toothStatus, iprData }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Reusable Tooth component for printing
  const ToothWithIPR = ({
    num,
    paths,
    status,
    isUpperJaw,
    iprBefore,
    iprAfter,
  }) => {
    const TOOTH_STATUSES = {
      movable: { color: '#00adef' },
      unmovable: { color: '#F44336' },
      missing: { color: '#9E9E9E' },
      note: { color: '#fa9600' },
    };

    const color = TOOTH_STATUSES[status]?.color || '#00adef';

    return (
      <>
        {/* IPR value before tooth */}
        {iprBefore && (
          <div
            className="flex items-center justify-center"
            style={{ width: '4px', minHeight: '64px' }}
          >
            <div
              className="text-xs font-semibold text-orange-600 bg-orange-50 px-1 rounded whitespace-nowrap"
              style={{
                position: 'relative',
                top: isUpperJaw ? '8px' : '-16px',
              }}
            >
              {iprBefore}
            </div>
          </div>
        )}

        {/* Tooth */}
        <div
          className="flex flex-col items-center relative"
          style={{ width: '48px', minHeight: '64px' }}
        >
          <div
            className="flex justify-center mb-1"
            style={{
              width: '48px',
              height: '72px',
              alignItems: isUpperJaw ? 'flex-end' : 'flex-start',
              marginBottom: isUpperJaw ? '10px' : 0,
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 21.1 56.7"
              className="w-full h-full"
              fill={color}
              style={{ maxWidth: '48px', maxHeight: '72px', display: 'block' }}
            >
              {paths.map((d, i) => (
                <path key={i} d={d} />
              ))}
            </svg>
          </div>
          <p
            className="text-xs text-center"
            style={{ lineHeight: '1', width: '100%', margin: 0 }}
          >
            {num}
          </p>
        </div>

        {/* IPR value after tooth */}
        {iprAfter && (
          <div
            className="flex items-center justify-center"
            style={{ width: '4px', minHeight: '64px' }}
          >
            <div
              className="text-xs font-semibold text-orange-600 bg-orange-50 px-1 rounded whitespace-nowrap"
              style={{
                position: 'relative',
                top: isUpperJaw ? '8px' : '-16px',
              }}
            >
              {iprAfter}
            </div>
          </div>
        )}
      </>
    );
  };

  const getSingleIPR = (toothNum, side) => {
    const toothData = iprData[toothNum];
    if (!toothData) return null;
    const value = toothData[side] || 0;
    if (value > 0) {
      return value % 1 === 0
        ? value.toString()
        : value.toFixed(2).replace(/\.?0+$/, '');
    }
    return null;
  };

  const getCombinedIPR = (tooth1, tooth2) => {
    const tooth1Data = iprData[tooth1];
    const tooth2Data = iprData[tooth2];
    if (!tooth1Data && !tooth2Data) return null;

    let value = 0;

    if (tooth1 >= 1 && tooth1 <= 16) {
      if (tooth1 === 1 && tooth2 === 2) {
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.distal || 0);
      } else if (tooth1 >= 2 && tooth1 <= 7 && tooth2 === tooth1 + 1) {
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.distal || 0);
      } else if (tooth1 === 8 && tooth2 === 9) {
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.mesial || 0);
      } else if (tooth1 >= 9 && tooth1 <= 15 && tooth2 === tooth1 + 1) {
        value = (tooth1Data?.distal || 0) + (tooth2Data?.mesial || 0);
      }
    } else if (tooth1 >= 17 && tooth1 <= 32) {
      if (tooth1 === 32 && tooth2 === 31) {
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.distal || 0);
      } else if (tooth1 >= 26 && tooth1 <= 31 && tooth2 === tooth1 - 1) {
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.distal || 0);
      } else if (tooth1 === 25 && tooth2 === 24) {
        value = (tooth1Data?.mesial || 0) + (tooth2Data?.mesial || 0);
      } else if (tooth1 >= 18 && tooth1 <= 24 && tooth2 === tooth1 - 1) {
        value = (tooth1Data?.distal || 0) + (tooth2Data?.mesial || 0);
      } else if (tooth1 === 18 && tooth2 === 17) {
        value = (tooth1Data?.distal || 0) + (tooth2Data?.mesial || 0);
      }
    }

    if (value > 0) {
      return value % 1 === 0
        ? value.toString()
        : value.toFixed(2).replace(/\.?0+$/, '');
    }
    return null;
  };

  return (
    <div
      className={`flex flex-col items-center gap-8`}
      style={{
        transform: 'scale(0.85)',
        transformOrigin: 'top center',
        direction: 'ltr',
      }}
    >
      {/* Upper jaw */}
      <div className="flex relative items-center">
        {[...Array(16)].map((_, i) => {
          const num = i + 1;
          const paths = toothPaths[`tooth${num}`] || [];
          const status = toothStatus[num] || 'movable';

          let iprBefore = null;
          let iprAfter = null;

          if (num === 1) {
            iprBefore = getSingleIPR(1, 'distal');
          } else {
            iprBefore = getCombinedIPR(num - 1, num);
          }

          if (num === 16) {
            iprAfter = getSingleIPR(16, 'distal');
          }

          return (
            <ToothWithIPR
              key={num}
              num={num}
              paths={paths}
              status={status}
              isUpperJaw={true}
              iprBefore={iprBefore}
              iprAfter={iprAfter}
            />
          );
        })}
      </div>

      {/* Lower jaw */}
      <div className="flex relative items-center">
        {[...Array(16)].map((_, i) => {
          const num = 32 - i;
          const paths = toothPaths[`tooth${num}`] || [];
          const status = toothStatus[num] || 'movable';

          let iprBefore = null;
          let iprAfter = null;

          if (num === 32) {
            iprBefore = getSingleIPR(32, 'distal');
          } else {
            iprBefore = getCombinedIPR(num + 1, num);
          }

          if (num === 17) {
            iprAfter = getSingleIPR(17, 'distal');
          }

          return (
            <ToothWithIPR
              key={num}
              num={num}
              paths={paths}
              status={status}
              isUpperJaw={false}
              iprBefore={iprBefore}
              iprAfter={iprAfter}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div
        className={`flex items-center gap-2 text-sm text-gray-600 bg-orange-50 px-4 py-2 rounded ${
          isRTL ? 'flex-row-reverse' : ''
        }`}
      >
        <div className="w-3 h-3 bg-orange-600 rounded"></div>
        <span>{t('iprChart.legend')}</span>
      </div>
    </div>
  );
};

export default IPRChartViewer;
