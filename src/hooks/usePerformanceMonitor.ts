import { useRef, useEffect } from 'react';

interface PerformanceMetrics {
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
  totalRenderTimes: number[];
}

export const usePerformanceMonitor = (_componentName: string) => {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef<number[]>([]);
  const startTimeRef = useRef<number>(0);

  // Track render start time
  const currentTime = performance.now();
  
  // Calculate render time if this isn't the first render
  if (startTimeRef.current > 0) {
    const renderTime = currentTime - startTimeRef.current;
    renderTimesRef.current = [...renderTimesRef.current, renderTime].slice(-10);
  }
  
  // Update refs
  renderCountRef.current += 1;
  startTimeRef.current = currentTime;

  // Calculate metrics without causing re-renders
  const averageRenderTime = renderTimesRef.current.length > 0 
    ? renderTimesRef.current.reduce((a, b) => a + b, 0) / renderTimesRef.current.length
    : 0;

  const metrics: PerformanceMetrics = {
    renderCount: renderCountRef.current,
    lastRenderTime: renderTimesRef.current[renderTimesRef.current.length - 1] || 0,
    averageRenderTime,
    totalRenderTimes: [...renderTimesRef.current]
  };

  return metrics;
};

export default usePerformanceMonitor;