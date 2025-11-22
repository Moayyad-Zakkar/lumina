import React from 'react';
import { toothPaths } from '../../assets/toothPaths'; // Adjust path as needed
import { FeatherSlice, FeatherX } from '@subframe/core';

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
    <div
      className="flex flex-col items-center relative"
      style={{ width: '48px', minHeight: '64px' }}
    >
      {/* IPR value before tooth (left side) */}
      {iprBefore && (
        <div
          className="absolute text-xs font-semibold text-orange-600 bg-orange-50 px-1 rounded"
          style={{
            left: '-8px',
            top: isUpperJaw ? 'auto' : '20px',
            bottom: isUpperJaw ? '20px' : 'auto',
            zIndex: 10,
          }}
        >
          {iprBefore}
        </div>
      )}

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

      {/* IPR value after tooth (right side) */}
      {iprAfter && (
        <div
          className="absolute text-xs font-semibold text-orange-600 bg-orange-50 px-1 rounded"
          style={{
            right: '-8px',
            top: isUpperJaw ? 'auto' : '20px',
            bottom: isUpperJaw ? '20px' : 'auto',
            zIndex: 10,
          }}
        >
          {iprAfter}
        </div>
      )}
    </div>
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
  // Get IPR value for a space, formatted
  const getIPRValue = (tooth1, tooth2) => {
    // Normalize to ascending order to match how spaces are stored
    const min = Math.min(tooth1, tooth2);
    const max = Math.max(tooth1, tooth2);
    const space = `${min}-${max}`;
    const value = iprData[space];
    if (value && value !== 0) {
      return `${value}`;
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-auto max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FeatherSlice className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex flex-col">
                <h2 className="text-heading-3 font-heading-3 text-default-font">
                  IPR Chart
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Interproximal Reduction values in millimeters
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FeatherX className="w-4 h-4 text-neutral-600" />
            </button>
          </div>

          {/* Upper jaw */}
          <div className="flex relative mb-3" style={{ gap: '4px' }}>
            {[...Array(16)].map((_, i) => {
              const num = i + 1;
              const paths = toothPaths[`tooth${num}`] || [];
              const status = toothStatus[num] || 'movable';

              // IPR before this tooth (between previous and current)
              const iprBefore = i > 0 ? getIPRValue(i, i + 1) : null;
              // IPR after this tooth (between current and next)
              const iprAfter = i < 15 ? getIPRValue(i + 1, i + 2) : null;

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
          <div className="flex relative mb-3" style={{ gap: '4px' }}>
            {[...Array(16)].map((_, i) => {
              const num = 32 - i;
              const paths = toothPaths[`tooth${num}`] || [];
              const status = toothStatus[num] || 'movable';

              // Lower jaw teeth: 32, 31, 30, ..., 17
              // Spaces stored as: "31-32", "30-31", "29-30", ..., "17-18"
              // iprBefore: space to the left (between previous tooth and current)
              // iprAfter: space to the right (between current and next tooth)
              const iprBefore = i > 0 ? getIPRValue(num, num + 1) : null;
              const iprAfter = i < 15 ? getIPRValue(num - 1, num) : null;

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
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-orange-50 px-4 py-2 rounded">
            <div className="w-3 h-3 bg-orange-600 rounded"></div>
            <span>
              Orange values indicate IPR (Interproximal Reduction) in
              millimeters
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default IPRChartViewer;
