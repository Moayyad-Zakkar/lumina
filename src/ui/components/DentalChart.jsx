// src/ui/components/DentalChart.jsx - With built-in scaling support and i18next
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { toothPaths } from '../../assets/toothPaths';
import { universalToFdi } from '../../helper/toothNumbering';

// Reusable Tooth component
const Tooth = ({
  num,
  paths,
  onClick,
  isUpperJaw,
  readOnly = false,
  statusColor,
}) => {
  return (
    <div
      onClick={!readOnly ? onClick : undefined}
      className={`cursor-${
        readOnly ? 'default' : 'pointer'
      } flex flex-col items-center flex-shrink-0`}
      style={{ width: '48px', minHeight: '64px' }} // Fixed container dimensions
    >
      {/* SVG Container with alignment based on jaw position */}
      <div
        className="flex justify-center mb-1"
        style={{
          width: '48px',
          height: '72px',
          alignItems: isUpperJaw ? 'flex-end' : 'flex-start', // Align to bottom for upper, top for lower
          marginBottom: isUpperJaw ? '10px' : 0, // This is because i've designed the svgs with different allignment depending on the jaws
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 21.1 56.7" // Slightly larger viewBox to ensure all teeth fit
          className="w-full h-full"
          fill={statusColor}
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
        {universalToFdi(num)}
      </p>
    </div>
  );
};

const DentalChart = ({
  initialStatus = {},
  onChange,
  readOnly = false,
  scale = 1, // New prop for manual scaling (overrides auto-scaling)
  showLegend = true, // New prop to optionally hide legend
}) => {
  const { t } = useTranslation();
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const [autoScale, setAutoScale] = useState(1);

  // Define tooth statuses with colors and descriptions (using translations)
  const TOOTH_STATUSES = {
    movable: {
      color: '#00adef', // 3da blue
      description: t('dentalChart.statuses.movable'),
    },
    unmovable: {
      color: '#F44336', // red
      description: t('dentalChart.statuses.unmovable'),
    },
    missing: {
      color: '#9E9E9E', // gray
      description: t('dentalChart.statuses.missing'),
    },
    note: {
      color: '#fa9600', // orange
      description: t('dentalChart.statuses.note'),
    },
  };

  const [toothStatus, setToothStatus] = useState(() =>
    Object.keys(initialStatus).length > 0
      ? initialStatus
      : Object.fromEntries([...Array(32)].map((_, i) => [i + 1, 'movable']))
  );

  // Calculate auto-scale based on container width
  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef.current || !chartRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      // Chart natural width: 16 teeth × 48px + 15 gaps × 4px = 768px + 60px = 828px
      // Plus padding: 32px (16px on each side)
      const chartNaturalWidth = 828 + 32; // 860px
      
      // Calculate scale to fit, leaving some margin (10px padding on each side)
      const availableWidth = containerWidth - 20;
      const calculatedScale = Math.min(1, availableWidth / chartNaturalWidth);
      
      setAutoScale(Math.max(0.3, calculatedScale)); // Minimum scale of 0.3 to prevent too small
    };

    // Initial calculation after mount
    const timeoutId = setTimeout(calculateScale, 0);
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateScale);
    
    // Use ResizeObserver for more accurate container size tracking
    let resizeObserver = null;
    if (containerRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(calculateScale);
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateScale);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const cycleStatus = (toothNum) => {
    const statuses = Object.keys(TOOTH_STATUSES);
    const current = toothStatus[toothNum];
    const nextIndex = (statuses.indexOf(current) + 1) % statuses.length;
    const nextStatus = statuses[nextIndex];
    const updated = { ...toothStatus, [toothNum]: nextStatus };
    setToothStatus(updated);
    onChange?.(updated); // notify parent (CaseSubmit or CaseDetail page)
  };

  // Use manual scale if provided, otherwise use auto-scale
  const finalScale = scale !== 1 ? scale : autoScale;
  
  // Calculate the actual scaled dimensions
  const chartNaturalWidth = 828; // 16 teeth × 48px + 15 gaps × 4px
  const chartNaturalHeight = 200; // Approximate height for both jaws with gap
  const scaledHeight = chartNaturalHeight * finalScale;
  
  // Wrapper style for scaling - only applies to jaws
  const jawsWrapperStyle =
    finalScale !== 1
      ? {
          transform: `scale(${finalScale})`,
          transformOrigin: 'top center',
          width: `${chartNaturalWidth}px`,
          height: `${chartNaturalHeight}px`,
        }
      : {};

  return (
    <div 
      className="flex flex-col items-center w-full" 
      style={{ 
        padding: finalScale < 1 ? '4px' : '16px',
        gap: finalScale < 1 ? '16px' : '32px', // Reduce gap on mobile
      }}
    >
      {/* Container for jaws with scaling */}
      <div 
        ref={containerRef}
        className="flex w-full justify-center overflow-hidden"
        style={
          finalScale !== 1
            ? {
                height: `${scaledHeight}px`,
                width: '100%',
              }
            : {}
        }
      >
        <div 
          ref={chartRef}
          className="flex flex-col items-center" 
          style={{
            ...jawsWrapperStyle,
            gap: finalScale !== 1 ? `${32 * finalScale}px` : '32px', // Scale the gap proportionally
          }}
        >
          {/* Upper jaw */}
          <div className="flex flex-nowrap" style={{ gap: '4px', direction: 'ltr' }}>
            {[...Array(16)].map((_, i) => {
              const num = i + 1;
              const paths = toothPaths[`tooth${num}`] || [];
              const status = toothStatus[num];
              const statusColor = TOOTH_STATUSES[status]?.color;

              return (
            <Tooth
              key={num}
              num={num}
              paths={paths}
              onClick={() => cycleStatus(num)}
              isUpperJaw={true}
              readOnly={readOnly}
              statusColor={statusColor}
            />
              );
            })}
          </div>

          {/* Lower jaw */}
          <div className="flex flex-nowrap" style={{ gap: '4px', direction: 'ltr' }}>
            {[...Array(16)].map((_, i) => {
              const num = 32 - i;
              const paths = toothPaths[`tooth${num}`] || [];
              const status = toothStatus[num];
              const statusColor = TOOTH_STATUSES[status]?.color;

              return (
                <Tooth
                  key={num}
                  num={num}
                  paths={paths}
                  status={status}
                  onClick={() => cycleStatus(num)}
                  isUpperJaw={false}
                  readOnly={readOnly}
                  statusColor={statusColor}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend with descriptions - outside scaled container, stays normal size */}
      {showLegend && (
        <div className="flex flex-col gap-3 mt-4 max-w-2xl w-full">
          {Object.entries(TOOTH_STATUSES).map(
            ([status, { color, description }]) => (
              <div key={status} className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: color }}
                  className="w-5 h-5 border flex-shrink-0"
                />
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
                  <span className="capitalize font-medium text-sm">
                    {t(`dentalChart.statusLabels.${status}`)}:
                  </span>
                  <span className="text-sm text-gray-600">{description}</span>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default DentalChart;
