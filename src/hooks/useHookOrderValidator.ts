import { useRef, useEffect } from 'react';

interface HookCallInfo {
  name: string;
  order: number;
}

/**
 * Development utility to validate hook call order consistency
 * Only runs in development mode to avoid production overhead
 */
export const useHookOrderValidator = (componentName: string) => {
  const hookCallsRef = useRef<HookCallInfo[]>([]);
  const renderCountRef = useRef(0);
  const expectedOrderRef = useRef<string[]>([]);

  if (process.env.NODE_ENV === 'development') {
    renderCountRef.current += 1;

    // Reset hook calls for this render
    hookCallsRef.current = [];

    // Create a proxy to track hook calls (simplified version)
    useEffect(() => {
      if (renderCountRef.current === 1) {
        // First render - establish expected order
        expectedOrderRef.current = hookCallsRef.current.map(call => call.name);
      } else {
        // Subsequent renders - validate order
        const currentOrder = hookCallsRef.current.map(call => call.name);
        const expectedOrder = expectedOrderRef.current;

        if (currentOrder.length !== expectedOrder.length) {
          console.warn(
            `🚨 Hook Order Violation in ${componentName}:`,
            `Expected ${expectedOrder.length} hooks, got ${currentOrder.length}`
          );
        }

        for (let i = 0; i < Math.min(currentOrder.length, expectedOrder.length); i++) {
          if (currentOrder[i] !== expectedOrder[i]) {
            console.warn(
              `🚨 Hook Order Violation in ${componentName}:`,
              `Position ${i + 1}: Expected ${expectedOrder[i]}, got ${currentOrder[i]}`
            );
            break;
          }
        }
      }
    });
  }

  // Helper function to track hook calls
  const trackHook = (hookName: string) => {
    if (process.env.NODE_ENV === 'development') {
      hookCallsRef.current.push({
        name: hookName,
        order: hookCallsRef.current.length + 1
      });
    }
  };

  return { trackHook };
};

/**
 * Higher-order hook wrapper for debugging hook order issues
 */
export const withHookTracking = <T extends any[], R>(
  hook: (...args: T) => R,
  hookName: string,
  componentName: string
) => {
  return (...args: T): R => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`📎 ${componentName}: Calling ${hookName}`);
    }
    return hook(...args);
  };
};

export default useHookOrderValidator;