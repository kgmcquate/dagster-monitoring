// Runtime configuration utility
// This provides access to environment variables that can be set at runtime

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      DAGSTER_GRAPHQL_URL?: string;
      DAGSTER_BASE_URL?: string;
      BASE_PATH?: string;
    };
  }
}

export const getRuntimeConfig = () => {
  // Use runtime config if available, otherwise fall back to build-time config
  const runtimeConfig = window.__RUNTIME_CONFIG__ || {};
  
  return {
    DAGSTER_GRAPHQL_URL: 
      runtimeConfig.DAGSTER_GRAPHQL_URL || 
      import.meta.env.DAGSTER_GRAPHQL_URL || 
      '/graphql',
    DAGSTER_BASE_URL: 
      runtimeConfig.DAGSTER_BASE_URL || 
      import.meta.env.DAGSTER_BASE_URL || 
      '/',
    BASE_PATH: 
      runtimeConfig.BASE_PATH || 
      import.meta.env.BASE_PATH || 
      ''
  };
};