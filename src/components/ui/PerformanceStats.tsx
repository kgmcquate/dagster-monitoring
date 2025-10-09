import React, { useState, useCallback, memo } from 'react';
import { usePerformanceMonitor } from '../../hooks';

interface PerformanceStatsProps {
  componentName: string;
  visible?: boolean;
}

export const PerformanceStats: React.FC<PerformanceStatsProps> = memo(({ 
  componentName, 
  visible = process.env.NODE_ENV === 'development' 
}) => {
  const metrics = usePerformanceMonitor(componentName);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  if (!visible || metrics.renderCount === 0) {
    return null;
  }

  // Only show if render count is reasonable (< 1000) to prevent infinite loops
  if (metrics.renderCount > 1000) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-red-900 text-white rounded-lg shadow-lg max-w-sm p-4">
          <div className="text-sm font-medium">⚠️ {componentName}</div>
          <div className="text-xs">Infinite render loop detected!</div>
          <div className="text-xs">{metrics.renderCount} renders</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white rounded-lg shadow-lg max-w-sm">
        <button
          onClick={toggleExpanded}
          className="w-full px-4 py-2 text-left hover:bg-gray-800 rounded-lg transition-colors"
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">🚀 {componentName}</span>
            <span className={`text-xs px-2 py-1 rounded ${
              metrics.renderCount > 100 ? 'bg-red-600' : 
              metrics.renderCount > 50 ? 'bg-yellow-600' : 'bg-green-600'
            }`}>
              {metrics.renderCount} renders
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div className="px-4 pb-4 border-t border-gray-700 mt-2 pt-2">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Last Render:</span>
                <span className="font-mono">{metrics.lastRenderTime.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Average:</span>
                <span className="font-mono">{metrics.averageRenderTime.toFixed(2)}ms</span>
              </div>
              <div className="flex justify-between">
                <span>Total Renders:</span>
                <span className="font-mono">{metrics.renderCount}</span>
              </div>
              {metrics.renderCount > 50 && (
                <div className="text-yellow-400 text-xs mt-2">
                  ⚠️ High render count - check for infinite loops
                </div>
              )}
              {metrics.averageRenderTime > 16 && metrics.renderCount < 50 && (
                <div className="text-yellow-400 text-xs mt-2">
                  ⚠️ Consider optimization (target: &lt;16ms)
                </div>
              )}
              {metrics.averageRenderTime <= 16 && metrics.renderCount < 50 && (
                <div className="text-green-400 text-xs mt-2">
                  ✅ Good performance (&lt;16ms)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PerformanceStats.displayName = 'PerformanceStats';

export default PerformanceStats;