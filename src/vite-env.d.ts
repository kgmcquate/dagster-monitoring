/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DAGSTER_GRAPHQL_URL: string
  readonly VITE_DAGSTER_AUTH_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}