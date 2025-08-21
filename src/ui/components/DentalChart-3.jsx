// src/ui/components/DentalChart.jsx
import React, { useState } from 'react';
import { teethSvgs } from '../../helper/teethSvgs';

// Define tooth statuses with colors (overlay tint or border)
const TOOTH_STATUSES = {
  movable: '#4CAF50', // green
  unmovable: '#F44336', // red
  missing: '#9E9E9E', // gray
  note: '#2196F3', // blue
};

// Reusable Tooth component
const Tooth = ({ num, SvgFile, status, onClick }) => {
  const color = TOOTH_STATUSES[status];
  console.log('Mask URL:', SvgFile);
  return (
    <div
      onClick={onClick}
      className="cursor-pointer flex flex-col items-center"
    >
      <div
        className="w-16 h-16 flex items-center justify-center relative"
        style={{
          WebkitMaskImage: `url(${SvgFile})`,
          WebkitMaskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskImage: `url(${SvgFile})`,
          maskRepeat: 'no-repeat',
          maskPosition: 'center',
          maskSize: 'contain',
          backgroundColor: color,
        }}
      />
      <p className="text-xs text-center">{num}</p>
    </div>
  );
};

const DentalChart = () => {
  // initialize all 32 teeth as movable
  const [toothStatus, setToothStatus] = useState(
    Object.fromEntries([...Array(32)].map((_, i) => [i + 1, 'movable']))
  );

  const cycleStatus = (toothNum) => {
    const statuses = Object.keys(TOOTH_STATUSES);
    const current = toothStatus[toothNum];
    const nextIndex = (statuses.indexOf(current) + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];
    setToothStatus({ ...toothStatus, [toothNum]: nextStatus });
  };

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Upper jaw */}
      <div className="flex gap-2">
        {[...Array(16)].map((_, i) => {
          const num = i + 1;
          const SvgFile = teethSvgs[num];
          const status = toothStatus[num];
          return (
            <Tooth
              key={num}
              num={num}
              SvgFile={SvgFile}
              status={status}
              onClick={() => cycleStatus(num)}
            />
          );
        })}
      </div>

      {/* Lower jaw */}
      <div className="flex gap-2">
        {[...Array(16)].map((_, i) => {
          const num = i + 17;
          const SvgFile = teethSvgs[num];
          const status = toothStatus[num];

          return (
            <Tooth
              key={num}
              num={num}
              SvgFile={SvgFile}
              status={status}
              onClick={() => cycleStatus(num)}
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
