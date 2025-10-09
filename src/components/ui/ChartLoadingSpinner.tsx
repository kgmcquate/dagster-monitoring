import React from 'react';

interface ChartLoadingSpinnerProps {
  height?: number;
  message?: string;
}

export const ChartLoadingSpinner: React.FC<ChartLoadingSpinnerProps> = ({ 
  height = 300, 
  message = "Loading chart..." 
}) => {
  return (
    <div 
      className="flex flex-col items-center justify-center space-y-4"
      style={{ height: `${height}px` }}
    >
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-gray-200 animate-spin border-t-blue-500"></div>
        <div className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-t-blue-300 animate-ping"></div>
      </div>
      <p className="text-sm text-color-text-lighter animate-pulse">{message}</p>
    </div>
  );
};

export default ChartLoadingSpinner;