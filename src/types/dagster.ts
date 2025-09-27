// Core Dagster GraphQL Types
export interface AssetKey {
  path: string[];
}

export interface Asset {
  id: string;
  key: AssetKey;
  definition?: AssetNode;
  assetHealth?: AssetHealth;
  latestEventSortKey?: string;
  assetMaterializations: MaterializationEvent[];
  assetObservations: ObservationEvent[];
  assetEventHistory: AssetResultEventHistoryConnection;
}

export interface AssetNode {
  id: string;
  description?: string;
  groupName?: string;
  partitionDefinition?: PartitionDefinition;
  assetKey: AssetKey;
  repository?: {
    name: string;
    location: {
      name: string;
    };
  };
  freshnessStatusInfo?: {
    freshnessStatus: FreshnessStatus;
    freshnessStatusMetadata?: {
      lastMaterializedTimestamp?: string;
    };
  };
  assetChecks?: AssetCheck[];
}

export enum FreshnessStatus {
  HEALTHY = 'HEALTHY',
  WARNING = 'WARNING',
  DEGRADED = 'DEGRADED',
  UNKNOWN = 'UNKNOWN',
  NOT_APPLICABLE = 'NOT_APPLICABLE'
}

export interface AssetHealth {
  status: AssetHealthStatus;
  lastUpdated?: string;
}

export enum AssetHealthStatus {
  FRESH = 'FRESH',
  STALE = 'STALE',
  MISSING = 'MISSING'
}

export interface MaterializationEvent {
  runId: string;
  message: string;
  timestamp: string;
  level: LogLevel;
  eventType?: DagsterEventType;
  stepKey?: string;
  assetKey?: AssetKey;
  partition?: string;
  metadataEntries: MetadataEntry[];
  tags: EventTag[];
  assetLineage: AssetLineageInfo[];
  runOrError: RunOrError;
  stepStats: RunStepStats;
}

export interface ObservationEvent {
  runId: string;
  message: string;
  timestamp: string;
  level: LogLevel;
  eventType?: DagsterEventType;
  stepKey?: string;
  assetKey?: AssetKey;
  partition?: string;
  metadataEntries: MetadataEntry[];
  runOrError: RunOrError;
  stepStats: RunStepStats;
}

export interface AssetCheck {
  name: string;
  assetKey: AssetKey;
  description?: string;
  jobNames: string[];
  executionForLatestMaterialization?: AssetCheckExecution;
  canExecuteIndividually: AssetCheckCanExecuteIndividually;
  blocking: boolean;
  additionalAssetKeys: AssetKey[];
}

export interface AssetCheckEvaluationEvent {
  runId: string;
  message: string;
  timestamp: string;
  level: LogLevel;
  eventType?: DagsterEventType;
  stepKey?: string;
  evaluation: AssetCheckEvaluation;
}

export interface AssetCheckEvaluation {
  checkName: string;
  passed: boolean;
  metadataEntries: MetadataEntry[];
  targetMaterialization?: MaterializationEvent;
}

export interface AssetCheckExecution {
  id: string;
  runId: string;
  status: AssetCheckExecutionStatus;
  timestamp?: string;
  evaluation?: {
    checkName: string;
    severity?: string;
    success: boolean;
    description?: string;
    metadataEntries?: Array<{
      label: string;
      description?: string;
    }>;
  };
}

export enum AssetCheckExecutionStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  IN_PROGRESS = 'IN_PROGRESS'
}

export enum AssetCheckCanExecuteIndividually {
  CAN_EXECUTE = 'CAN_EXECUTE',
  REQUIRES_MATERIALIZATION = 'REQUIRES_MATERIALIZATION'
}

export interface MetadataEntry {
  label: string;
  description?: string;
  value: MetadataValue;
}

export interface MetadataValue {
  __typename: string;
  // Union type - specific implementations will have different fields
}

export interface EventTag {
  key: string;
  value: string;
}

export interface AssetLineageInfo {
  assetKey: AssetKey;
  partitions: string[];
}

export interface RunOrError {
  __typename: 'Run' | 'RunNotFoundError';
  // Union type
}

export interface RunStepStats {
  stepKey: string;
  status: StepEventStatus;
  startTime?: string;
  endTime?: string;
}

export interface AssetResultEventHistoryConnection {
  results: AssetResultEventType[];
  cursor: string;
}

export type AssetResultEventType = MaterializationEvent | ObservationEvent | FailedToMaterializeEvent;

export interface FailedToMaterializeEvent {
  runId: string;
  message: string;
  timestamp: string;
  level: LogLevel;
  assetKey?: AssetKey;
  error: PythonError;
}

export interface PythonError {
  message: string;
  stack: string[];
}

export interface PartitionDefinition {
  description?: string;
  dimensionTypes: PartitionDimensionType[];
}

export interface PartitionDimensionType {
  name: string;
  type: string;
}

export enum LogLevel {
  CRITICAL = 'CRITICAL',
  ERROR = 'ERROR',
  WARNING = 'WARNING',
  INFO = 'INFO',
  DEBUG = 'DEBUG'
}

export enum DagsterEventType {
  ASSET_MATERIALIZATION = 'ASSET_MATERIALIZATION',
  ASSET_OBSERVATION = 'ASSET_OBSERVATION',
  ASSET_CHECK_EVALUATION = 'ASSET_CHECK_EVALUATION',
  ASSET_CHECK_EVALUATION_PLANNED = 'ASSET_CHECK_EVALUATION_PLANNED'
}

export enum StepEventStatus {
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  SKIPPED = 'SKIPPED',
  IN_PROGRESS = 'IN_PROGRESS'
}

// Dashboard specific types
export interface DashboardStats {
  totalAssets: number;
  healthyAssets: number;
  staleAssets: number;
  failedMaterializations: number;
  recentMaterializations: number;
  failedChecks: number;
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AssetHealthOverview {
  assetKey: AssetKey;
  status: AssetHealthStatus;
  lastMaterialization?: string;
  lastObservation?: string;
  checksPassing: number;
  totalChecks: number;
}

// Job Run Types
export interface JobRun {
  id: string;
  runId: string;
  status: RunStatus;
  stats?: RunStatsSnapshot;
  pipelineName: string;
  repositoryOrigin: RepositoryOrigin;
  tags: RunTag[];
  creationTime: string;
  startTime?: string;
  endTime?: string;
  updateTime: string;
}

export interface RepositoryOrigin {
  repositoryName: string;
  repositoryLocationName: string;
}

export interface RunStatsSnapshot {
  startTime?: string;
  endTime?: string;
  stepsSucceeded: number;
  stepsFailed: number;
  materializations: number;
  expectations: number;
}

export interface RunTag {
  key: string;
  value: string;
}

export enum RunStatus {
  QUEUED = 'QUEUED',
  NOT_STARTED = 'NOT_STARTED',
  MANAGED = 'MANAGED',
  STARTING = 'STARTING',
  STARTED = 'STARTED',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE',
  CANCELING = 'CANCELING',
  CANCELED = 'CANCELED'
}

export interface JobRunsOverview {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  runningRuns: number;
  avgDuration: number;
}