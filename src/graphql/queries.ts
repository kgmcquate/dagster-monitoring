import { gql } from '@apollo/client';

export const GET_ASSETS_OVERVIEW = gql`
  query GetAssetsOverview($limit: Int = 1000, $cursor: String) {
    assetsOrError(limit: $limit, cursor: $cursor) {
      ... on AssetConnection {
        nodes {
          id
          key {
            path
          }
          definition {
            id
            description
            groupName
            assetKey {
              path
            }
            repository {
              location {
                name
              }
              name
            }
            freshnessStatusInfo {
              freshnessStatus
              freshnessStatusMetadata {
                lastMaterializedTimestamp
              }
            }
          }
          latestEventSortKey
          # Only get latest materialization for performance
          assetMaterializations(limit: 1) {
            runId
            timestamp
            partition
            stepStats {
              stepKey
              status
              startTime
              endTime
            }
          }
          # Only get latest observation for performance
          assetObservations(limit: 1) {
            runId
            timestamp
            partition
            level
          }
        }
      }
    }
  }
`;

export const GET_ASSET_MATERIALIZATIONS = gql`
  query GetAssetMaterializations($assetKey: AssetKeyInput!, $limit: Int = 100) {
    assetOrError(assetKey: $assetKey) {
      ... on Asset {
        id
        key {
          path
        }
        assetMaterializations(limit: $limit) {
          runId
          message
          timestamp
          level
          eventType
          stepKey
          partition
          metadataEntries {
            label
            description
          }
          tags {
            key
            value
          }
          stepStats {
            stepKey
            status
            startTime
            endTime
          }
        }
      }
    }
  }
`;

export const GET_ASSET_OBSERVATIONS = gql`
  query GetAssetObservations($assetKey: AssetKeyInput!, $limit: Int = 1000) {
    assetOrError(assetKey: $assetKey) {
      ... on Asset {
        id
        key {
          path
        }
        assetObservations(limit: $limit) {
          runId
          message
          timestamp
          level
          eventType
          stepKey
          partition
          metadataEntries {
            label
            description
          }
          stepStats {
            stepKey
            status
            startTime
            endTime
          }
        }
      }
    }
  }
`;

export const GET_ASSET_CHECKS = gql`
  query GetAssetChecks($assetKey: AssetKeyInput!) {
    assetChecksOrError(assetKey: $assetKey) {
      ... on AssetChecks {
        checks {
          name
          assetKey {
            path
          }
          description
          jobNames
          executionForLatestMaterialization {
            id
            runId
            status
          }
          canExecuteIndividually
          blocking
        }
      }
    }
  }
`;

export const GET_ASSET_EVENT_HISTORY = gql`
  query GetAssetEventHistory(
    $assetKey: AssetKeyInput!
    $limit: Int = 1000
    $eventTypeSelectors: [AssetEventHistoryEventTypeSelector!]!
  ) {
    assetOrError(assetKey: $assetKey) {
      ... on Asset {
        id
        key {
          path
        }
        assetEventHistory(limit: $limit, eventTypeSelectors: $eventTypeSelectors) {
          results {
            ... on MaterializationEvent {
              __typename
              runId
              timestamp
              partition
              stepStats {
                status
                startTime
                endTime
              }
            }
            ... on ObservationEvent {
              __typename
              runId
              timestamp
              partition
              level
              metadataEntries {
                label
                description
              }
            }
            ... on FailedToMaterializeEvent {
              __typename
              runId
              timestamp
              partition
              message
            }
          }
          cursor
        }
      }
    }
  }
`;

export const GET_ALL_ASSET_CHECKS = gql`
  query GetAllAssetChecks($limit: Int = 100) {
    assetNodes {
      id
      jobNames
      assetKey {
        path
      }
      repository {
        location {
          name
        }
      }
      hasAssetChecks
      assetChecksOrError(limit: $limit) {
        ... on AssetChecks {
          checks {
            name
            blocking
            assetKey {
              path
            }
            executionForLatestMaterialization {
              id
              runId
              status
              evaluation {
                checkName
                severity
                success
                description
                metadataEntries {
                  label
                  description
                }
              }
              timestamp
            }
          }
        }
      }
    }
  }
`;

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats($limit: Int = 1000, $cursor: String) {
    assetsOrError(limit: $limit, cursor: $cursor) {
      ... on AssetConnection {
        nodes {
          id
          key {
            path
          }
          definition {
            id
            description
            groupName
            assetKey {
              path
            }
            repository {
              location {
                name
              }
            }
            freshnessStatusInfo {
              freshnessStatus
              freshnessStatusMetadata {
                lastMaterializedTimestamp
              }
            }
            hasAssetChecks
          }
          latestEventSortKey
          assetMaterializations(limit: $limit) {
            runId
            timestamp
            partition
            metadataEntries {
              label
              description
            }
            stepStats {
              stepKey
              status
              startTime
              endTime
            }
          }
          assetObservations(limit: $limit) {
            runId
            timestamp
            partition
            level
            metadataEntries {
              label
              description
            }
          }
        }
      }
    }
    runsOrError(limit: $limit) {
      ... on Runs {
        results {
          id
          runId
          status
          pipelineName
          startTime
          endTime
          mode
          repositoryOrigin {
            repositoryLocationName
            repositoryName
          }
          tags {
            key
            value
          }
        }
      }
    }
  }
`;

export const GET_ASSETS_LIVE_QUERY = gql`
  query AssetGraphLiveQuery($assetKeys: [AssetKeyInput!]!) {
    assetsLatestInfo(assetKeys: $assetKeys) {
      id
      assetKey {
        path
      }
      inProgressRunIds
    }
  }
`;