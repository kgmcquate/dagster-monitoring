import { Asset, MaterializationEvent, ObservationEvent, AssetCheck, JobRun } from './dagster';

// GraphQL Query Response Types
export interface AssetsOverviewResponse {
  assetsOrError: {
    nodes: Asset[];
  } | null;
  runsOrError?: {
    results: JobRun[];
  } | null;
}

export interface AssetMaterializationsResponse {
  assetOrError: {
    id: string;
    key: { path: string[] };
    assetMaterializations: MaterializationEvent[];
  } | null;
}

export interface AssetObservationsResponse {
  assetOrError: {
    id: string;
    key: { path: string[] };
    assetObservations: ObservationEvent[];
  } | null;
}

export interface AssetChecksResponse {
  assetChecksOrError: {
    checks: AssetCheck[];
  } | null;
}

export interface AssetEventHistoryResponse {
  assetOrError: {
    id: string;
    key: { path: string[] };
    assetEventHistory: {
      results: Array<
        | MaterializationEvent
        | ObservationEvent
        | { __typename: 'FailedToMaterializeEvent'; runId: string; timestamp: string; message: string; }
      >;
      cursor: string;
    };
  } | null;
}

// Query Variables Types
export interface AssetKeyInput {
  path: string[];
}

export interface AssetMaterializationsVariables {
  assetKey: AssetKeyInput;
  limit?: number;
}

export interface AssetObservationsVariables {
  assetKey: AssetKeyInput;
  limit?: number;
}

export interface AssetChecksVariables {
  assetKey: AssetKeyInput;
}

export interface AssetEventHistoryVariables {
  assetKey: AssetKeyInput;
  limit?: number;
  eventTypeSelectors: string[];
}