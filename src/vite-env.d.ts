/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DAGSTER_GRAPHQL_URL: string
  readonly VITE_DAGSTER_BASE_URL: string
  readonly VITE_DAGSTER_AUTH_TOKEN?: string
  readonly BASE_PATH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Runtime configuration interface
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      VITE_DAGSTER_GRAPHQL_URL?: string;
      VITE_DAGSTER_BASE_URL?: string;
      BASE_PATH?: string;
    };
  }
}