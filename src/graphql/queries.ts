import { gql } from '@apollo/client';

export const GET_ASSETS_OVERVIEW = gql`
  query GetAssetsOverview {
    assetsOrError {
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
          }
          latestEventSortKey
          assetMaterializations(limit: 5) {
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
          assetObservations(limit: 5) {
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
  query GetAssetObservations($assetKey: AssetKeyInput!, $limit: Int = 100) {
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
    $limit: Int = 50
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

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    assetsOrError {
      ... on AssetConnection {
        nodes {
          id
          key {
            path
          }
          definition {
            id
            groupName
            repository {
              name
              location {
                name
              }
            }
          }
          assetMaterializations(limit: 10) {
            runId
            timestamp
            stepStats {
              status
              startTime
              endTime
            }
          }
          assetObservations(limit: 5) {
            runId
            timestamp
            level
          }
        }
      }
    }
    runsOrError(limit: 100) {
      ... on Runs {
        results {
          id
          runId
          status
          stats {
            ... on RunStatsSnapshot {
              startTime
              endTime
              stepsSucceeded
              stepsFailed
              materializations
              expectations
            }
          }
          pipelineName
          repositoryOrigin {
            repositoryName
            repositoryLocationName
          }
          tags {
            key
            value
          }
          creationTime
          startTime
          endTime
          updateTime
        }
      }
    }
  }
`;