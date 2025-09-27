import React from 'react';

interface ChartGroupingToggleProps {
  groupByCodeLocation: boolean;
  onToggle: (grouped: boolean) => void;
}

export const ChartGroupingToggle: React.FC<ChartGroupingToggleProps> = ({ 
  groupByCodeLocation, 
  onToggle 
}) => {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <span className="text-sm font-medium" style={{ color: 'var(--color-text-default)' }}>
        Chart View:
      </span>
      <div className="flex bg-color-background-light rounded-lg p-1">
        <button
          onClick={() => onToggle(false)}
          className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
            !groupByCodeLocation
              ? 'bg-color-background-default text-color-text-default shadow-sm'
              : 'text-color-text-lighter hover:text-color-text-default'
          }`}
        >
          Combined
        </button>
        <button
          onClick={() => onToggle(true)}
          className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
            groupByCodeLocation
              ? 'bg-color-background-default text-color-text-default shadow-sm'
              : 'text-color-text-lighter hover:text-color-text-default'
          }`}
        >
          By Code Location
        </button>
      </div>
      <div className="text-xs" style={{ color: 'var(--color-text-lighter)' }}>
        {groupByCodeLocation ? 'Showing separate lines for each code location' : 'Showing aggregated data across all code locations'}
      </div>
    </div>
  );
};