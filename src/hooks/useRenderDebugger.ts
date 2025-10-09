import { useRef, useEffect } from 'react';

interface RenderInfo {
  count: number;
  reasons: string[];
  lastProps: any;
  lastState: any;
}

/**
 * Hook to debug why a component is re-rendering
 * Only active in development mode
 */
export const useRenderDebugger = (componentName: string, props: any = {}) => {
  const renderInfo = useRef<RenderInfo>({
    count: 0,
    reasons: [],
    lastProps: {},
    lastState: {}
  });

  const prevProps = useRef(props);

  if (process.env.NODE_ENV === 'development') {
    renderInfo.current.count += 1;
    
    // Check what changed
    const changedProps: string[] = [];
    Object.keys(props).forEach(key => {
      if (prevProps.current[key] !== props[key]) {
        changedProps.push(key);
      }
    });

    if (changedProps.length > 0) {
      renderInfo.current.reasons.push(`Props changed: ${changedProps.join(', ')}`);
    }

    // Log excessive renders
    if (renderInfo.current.count > 20 && renderInfo.current.count % 10 === 0) {
      console.warn(
        `🔄 ${componentName} has rendered ${renderInfo.current.count} times`,
        `Recent reasons:`, renderInfo.current.reasons.slice(-5)
      );
    }

    // Detect infinite loops
    if (renderInfo.current.count > 100) {
      console.error(
        `🚨 INFINITE RENDER LOOP DETECTED in ${componentName}!`,
        `Render count: ${renderInfo.current.count}`,
        `Recent reasons:`, renderInfo.current.reasons.slice(-10)
      );
    }

    prevProps.current = props;
  }

  return renderInfo.current;
};

export default useRenderDebugger;