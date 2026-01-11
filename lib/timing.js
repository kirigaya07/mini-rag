/**
 * Simple timing helper for performance metrics
 */

export function createTimer() {
  const start = Date.now();
  
  return {
    start,
    elapsed: () => Date.now() - start,
    elapsedSeconds: () => (Date.now() - start) / 1000,
  };
}

export function formatTime(ms) {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
