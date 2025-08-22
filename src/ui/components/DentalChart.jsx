// src/ui/components/DentalChart.jsx - Simple Alignment Fix
import React, { useState } from 'react';
import { toothPaths } from '../../assets/toothPaths';

// Define tooth statuses with colors
const TOOTH_STATUSES = {
  //movable: '#4CAF50', // green
  movable: '#0284c7', // blue
  unmovable: '#F44336', // red
  missing: '#9E9E9E', // gray
  note: '#fa9600', // orange
};

// Reusable Tooth component
const Tooth = ({
  num,
  paths,
  status,
  onClick,
  isUpperJaw,
  readOnly = false,
}) => {
  const color = TOOTH_STATUSES[status];

  return (
    <div
      onClick={!readOnly ? onClick : undefined}
      className={`cursor-${
        readOnly ? 'default' : 'pointer'
      } flex flex-col items-center`}
      style={{ width: '48px', minHeight: '64px' }} // Fixed container dimensions
    >
      {/* SVG Container with alignment based on jaw position */}
      <div
        className="flex justify-center mb-1"
        style={{
          width: '48px',
          height: '72px',
          alignItems: isUpperJaw ? 'flex-end' : 'flex-start', // Align to bottom for upper, top for lower
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          //viewBox="468 235 40 85" // Slightly larger viewBox to ensure all teeth fit
          viewBox="0 0 21.1 56.7" // Slightly larger viewBox to ensure all teeth fit
          className="w-full h-full"
          fill={color}
          style={{
            maxWidth: '48px',
            maxHeight: '72px',
            display: 'block', // Prevents inline spacing issues
          }}
        >
          {paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </svg>
      </div>

      {/* Number label with consistent positioning */}
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
  );
};

const DentalChart = ({ initialStatus = {}, onChange, readOnly = false }) => {
  const [toothStatus, setToothStatus] = useState(() =>
    Object.keys(initialStatus).length > 0
      ? initialStatus
      : Object.fromEntries([...Array(32)].map((_, i) => [i + 1, 'movable']))
  );

  const cycleStatus = (toothNum) => {
    const statuses = Object.keys(TOOTH_STATUSES);
    const current = toothStatus[toothNum];
    const nextIndex = (statuses.indexOf(current) + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];
    const updated = { ...toothStatus, [toothNum]: nextStatus };
    setToothStatus(updated);
    onChange?.(updated); // notify parent (CaseSubmit or CaseDetail page)
  };

  return (
    <div className="flex flex-col items-center gap-8 p-4">
      {/* Upper jaw */}
      <div className="flex" style={{ gap: '4px' }}>
        {[...Array(16)].map((_, i) => {
          const num = i + 1;
          const paths = toothPaths[`tooth${num}`] || [];
          const status = toothStatus[num];

          return (
            <Tooth
              key={num}
              num={num}
              paths={paths}
              status={status}
              onClick={() => cycleStatus(num)}
              isUpperJaw={true}
              readOnly={readOnly}
            />
          );
        })}
      </div>

      {/* Lower jaw */}
      <div className="flex" style={{ gap: '4px' }}>
        {[...Array(16)].map((_, i) => {
          const num = 32 - i;
          const paths = toothPaths[`tooth${num}`] || [];
          const status = toothStatus[num];

          return (
            <Tooth
              key={num}
              num={num}
              paths={paths}
              status={status}
              onClick={() => cycleStatus(num)}
              isUpperJaw={false}
              readOnly={readOnly}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap justify-center">
        {Object.entries(TOOTH_STATUSES).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1">
            <div
              style={{ backgroundColor: color }}
              className="w-5 h-5 border"
            />
            <span className="capitalize text-sm">{status}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DentalChart;
