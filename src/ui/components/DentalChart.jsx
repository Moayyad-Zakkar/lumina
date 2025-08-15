import React, { useState } from 'react';

const STATUS = {
  movable: '#4ade80', // green
  unmovable: '#60a5fa', // blue
  missing: '#d1d5db', // gray
  toBeExtracted: '#f87171', // red
};

// Tooth numbers layout from your chart
const TEETH = [
  [8, 7, 6, 5, 4, 3, 2, 1], // Upper right
  [9, 10, 11, 12, 13, 14, 15, 16], // Upper left
  [17, 18, 19, 20, 21, 22, 23, 24], // Lower left
  [32, 31, 30, 29, 28, 27, 26, 25], // Lower right
];

// Very simplified placeholder SVG paths — replace with actual tooth outlines from your chart if you have them in SVG
const TOOTH_PATH = 'M10 5 Q5 15 10 25 Q15 15 10 5 Z';

export default function DentalChart() {
  const [teethStatus, setTeethStatus] = useState(
    Object.fromEntries(Array.from({ length: 32 }, (_, i) => [i + 1, 'movable']))
  );

  const cycleStatus = (toothNum) => {
    const order = Object.keys(STATUS);
    const current = teethStatus[toothNum];
    const nextStatus = order[(order.indexOf(current) + 1) % order.length];
    setTeethStatus((prev) => ({ ...prev, [toothNum]: nextStatus }));
  };

  return (
    <div className="flex flex-col gap-6 items-center">
      {TEETH.map((row, idx) => (
        <div key={idx} className="flex gap-2">
          {row.map((num) => (
            <svg
              key={num}
              onClick={() => cycleStatus(num)}
              width="40"
              height="60"
              viewBox="0 0 20 30"
              className="cursor-pointer"
            >
              <path
                d={TOOTH_PATH}
                fill={STATUS[teethStatus[num]]}
                stroke="#000"
                strokeWidth="1"
              />
              <text
                x="50%"
                y="95%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontSize="4"
                fill="#000"
              >
                {num}
              </text>
            </svg>
          ))}
        </div>
      ))}

      {/* Legend */}
      <div className="flex gap-4 mt-4 flex-wrap justify-center">
        {Object.entries(STATUS).map(([name, color]) => (
          <div key={name} className="flex items-center gap-1">
            <div
              style={{ backgroundColor: color }}
              className="w-5 h-5 border"
            ></div>
            <span className="capitalize text-sm">{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
