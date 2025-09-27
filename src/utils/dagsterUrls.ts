// Utility functions for Dagster UI links

export const getDagsterBaseUrl = (): string => {
  return import.meta.env.VITE_DAGSTER_BASE_URL || 'http://localhost:3000';
};

export const getRunUrl = (runId: string): string => {
  const baseUrl = getDagsterBaseUrl().replace(/\/$/, ''); // Remove trailing slash
  return `${baseUrl}/runs/${runId}`;
};

export const getAssetUrl = (assetPath: string[]): string => {
  const baseUrl = getDagsterBaseUrl().replace(/\/$/, ''); // Remove trailing slash
  const encodedPath = assetPath.map(encodeURIComponent).join('/');
  return `${baseUrl}/assets/${encodedPath}`;
};