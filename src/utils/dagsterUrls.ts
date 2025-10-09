// Utility functions for Dagster UI links
import { getRuntimeConfig } from './runtimeConfig';

export const getDagsterBaseUrl = (): string => {
  const config = getRuntimeConfig();
  return config.DAGSTER_BASE_URL;
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

export const getAssetCheckUrl = (assetPath: string[], checkName: string): string => {
  const baseUrl = getDagsterBaseUrl().replace(/\/$/, ''); // Remove trailing slash
  const encodedPath = assetPath.map(encodeURIComponent).join('/');
  const encodedCheckName = encodeURIComponent(checkName);
  return `${baseUrl}/assets/${encodedPath}?view=checks&checkDetail=${encodedCheckName}`;
};