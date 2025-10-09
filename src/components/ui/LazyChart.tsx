import React, { Suspense } from 'react';
import { useInView } from '../../hooks';
import { ChartLoadingSpinner } from '../ui';

interface LazyChartProps {
  children: React.ReactNode;
  fallbackMessage?: string;
  height?: number;
  placeholder?: React.ReactNode;
}

export const LazyChart: React.FC<LazyChartProps> = ({
  children,
  fallbackMessage = "Loading chart...",
  height = 300,
  placeholder
}) => {
  const { ref, isInView } = useInView({ 
    threshold: 0.1, 
    rootMargin: '200px 0px', // Load charts when they're 200px away from viewport
    triggerOnce: true 
  });

  const defaultPlaceholder = (
    <div 
      className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
      style={{ height: `${height}px` }}
    >
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <p className="text-sm text-gray-500">Chart will load when visible</p>
      </div>
    </div>
  );

  return (
    <div ref={ref}>
      {isInView ? (
        <Suspense fallback={<ChartLoadingSpinner message={fallbackMessage} height={height} />}>
          {children}
        </Suspense>
      ) : (
        placeholder || defaultPlaceholder
      )}
    </div>
  );
};

export default LazyChart;