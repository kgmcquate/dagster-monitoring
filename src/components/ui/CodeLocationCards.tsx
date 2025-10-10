import React from 'react';
import { useQuery } from '@apollo/client';
import { Asset, JobRun, RunStatus, AssetHealthStatus, FreshnessStatus } from '../../types/dagster';
import { AssetsLiveResponse, AssetsLiveVariables } from '../../types/graphql';
import { GET_ASSETS_LIVE_QUERY } from '../../graphql/queries';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getCodeLocationColor } from '../../utils/codeLocationColors';

interface CodeLocationCardsProps {
  assets: Asset[];
  jobRuns: JobRun[];
}

interface CodeLocationStats {
  name: string;
  repositoryName: string;
  totalAssets: number;
  healthyAssets: number;
  staleAssets: number;
  missingAssets: number;
  failedMaterializations: number;
  runningAssets: number;
  totalJobRuns: number;
  successfulJobRuns: number;
  failedJobRuns: number;
  runningJobRuns: number;
}

function getAssetStatus(asset: Asset): AssetHealthStatus {
  // First check if we have Dagster's built-in freshness status
  const freshnessInfo = asset.definition?.freshnessStatusInfo;
  if (freshnessInfo) {
    // Use Dagster's actual freshness policy
    switch (freshnessInfo.freshnessStatus) {
      case FreshnessStatus.HEALTHY:
        return AssetHealthStatus.FRESH;
      case FreshnessStatus.WARNING:
      case FreshnessStatus.DEGRADED:
        return AssetHealthStatus.STALE;
      case FreshnessStatus.UNKNOWN:
      case FreshnessStatus.NOT_APPLICABLE:
        return AssetHealthStatus.MISSING; // Show as neutral/stale for not applicable
      default:
        return AssetHealthStatus.MISSING;
    }
  }

  // For assets without freshness policies, show as MISSING
  return AssetHealthStatus.MISSING;
}

export const CodeLocationCards: React.FC<CodeLocationCardsProps> = ({ assets, jobRuns }) => {
  // Prepare asset keys for the live query
  const assetKeys = React.useMemo(() => 
    assets.map(asset => ({ path: asset.key.path })), 
    [assets]
  );

  // Get live asset information including in-progress runs
  const { data: liveData } = useQuery<AssetsLiveResponse, AssetsLiveVariables>(GET_ASSETS_LIVE_QUERY, {
    variables: { assetKeys },
    skip: assetKeys.length === 0,
    pollInterval: 60000, // Poll every 60 seconds for updates
    errorPolicy: 'ignore', // Don't break if this query fails
  });

  // Group assets and job runs by code location
  const codeLocationStats = React.useMemo(() => {
    try {
      const statsMap = new Map<string, CodeLocationStats>();

      // Process assets
      assets.forEach(asset => {
        let codeLocation = (asset.definition?.repository?.location?.name || 'Unknown').trim();
        
        let repositoryName = (asset.definition?.repository?.name || '__repository__').trim();
        
        // Normalize repository name to match job runs format
        if (repositoryName === 'Unknown' || !repositoryName) {
          repositoryName = '__repository__';
        }
        
        // Normalize the key to avoid case sensitivity or whitespace issues
        const key = `${codeLocation.toLowerCase()}::${repositoryName.toLowerCase()}`;

        if (!statsMap.has(key)) {
          statsMap.set(key, {
            name: codeLocation, // Use original case for display
            repositoryName,     // Use original case for display
            totalAssets: 0,
          healthyAssets: 0,
          staleAssets: 0,
          missingAssets: 0,
          failedMaterializations: 0,
          runningAssets: 0,
          totalJobRuns: 0,
          successfulJobRuns: 0,
          failedJobRuns: 0,
          runningJobRuns: 0
        });
      }

      const stats = statsMap.get(key)!;
      stats.totalAssets++;

      const assetStatus = getAssetStatus(asset);
      if (assetStatus === AssetHealthStatus.FRESH) {
        stats.healthyAssets++;
      } else if (assetStatus === AssetHealthStatus.STALE) {
        stats.staleAssets++;
      } else {
        stats.missingAssets++;
      }

      // Count assets with failed latest materialization
      if (assetStatus === AssetHealthStatus.MISSING && asset.assetMaterializations && asset.assetMaterializations.length > 0) {
        // Asset has materializations but latest one failed
        stats.failedMaterializations++;
      }


    });

    // Calculate running assets using live data
    if (liveData?.assetsLatestInfo) {
      liveData.assetsLatestInfo.forEach(assetInfo => {
        if (assetInfo.inProgressRunIds && assetInfo.inProgressRunIds.length > 0) {
          // Find the corresponding asset to get its code location
          const asset = assets.find(a => 
            a.key.path.length === assetInfo.assetKey.path.length &&
            a.key.path.every((segment, index) => segment === assetInfo.assetKey.path[index])
          );
          
          if (asset) {
            const codeLocation = (asset.definition?.repository?.location?.name || 'Unknown').trim();
            let repositoryName = (asset.definition?.repository?.name || '__repository__').trim();
            
            if (repositoryName === 'Unknown' || !repositoryName) {
              repositoryName = '__repository__';
            }
            
            const key = `${codeLocation.toLowerCase()}::${repositoryName.toLowerCase()}`;
            
            if (statsMap.has(key)) {
              const stats = statsMap.get(key)!;
              stats.runningAssets++;
            }
          }
        }
      });
    }

      // Process job runs with enhanced safety checks
      jobRuns.forEach((run) => {
        if (!run || typeof run !== 'object') {
          return;
        }
        
        // Enhanced safety check for repositoryOrigin
        let codeLocation = 'Unknown';
        let repositoryName = 'Unknown';
        
        if (run.repositoryOrigin && typeof run.repositoryOrigin === 'object') {
          codeLocation = (run.repositoryOrigin.repositoryLocationName || 'Unknown').trim();
          
          // Fix potential typo in the data
          if (codeLocation.toLowerCase() === 'unkown') {
            codeLocation = 'Unknown';
          }
          repositoryName = (run.repositoryOrigin.repositoryName || '__repository__').trim();
        } else {
          // Use pipeline name as fallback for grouping
          codeLocation = (run.pipelineName || 'Unknown').trim();
          
          // Fix potential typo in pipeline name fallback
          if (codeLocation.toLowerCase() === 'unkown') {
            codeLocation = 'Unknown';
          }
          
          repositoryName = '__repository__';
        }
        
        // Normalize repository name to be consistent
        if (repositoryName === 'Unknown' || !repositoryName) {
          repositoryName = '__repository__';
        }
        
        // Normalize the key to match the asset processing
        const key = `${codeLocation.toLowerCase()}::${repositoryName.toLowerCase()}`;
        


        if (!statsMap.has(key)) {
          statsMap.set(key, {
            name: codeLocation, // Use original case for display
            repositoryName,     // Use original case for display  
            totalAssets: 0,
            healthyAssets: 0,
            staleAssets: 0,
            missingAssets: 0,
            failedMaterializations: 0,
            runningAssets: 0,
            totalJobRuns: 0,
            successfulJobRuns: 0,
            failedJobRuns: 0,
            runningJobRuns: 0
        });
      }

      const stats = statsMap.get(key)!;
      stats.totalJobRuns++;

      if (run.status === RunStatus.SUCCESS) {
        stats.successfulJobRuns++;
      } else if (run.status === RunStatus.FAILURE) {
        stats.failedJobRuns++;
      } else if ([RunStatus.STARTED, RunStatus.STARTING, RunStatus.QUEUED].includes(run.status)) {
        stats.runningJobRuns++;
      }
      });

      const result = Array.from(statsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      return result;
    } catch (error) {
      console.error('Error processing code location stats:', error);
      return [];
    }
  }, [assets, jobRuns, liveData]);

  if (codeLocationStats.length === 0) {
    return (
      <div className="bg-color-background-default border border-color-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-color-text-default mb-4">Code Locations</h3>
        <p className="text-color-text-lighter">No code locations found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {codeLocationStats.map((stats) => {
        // Determine overall health status
        const isUnhealthy = stats.failedMaterializations > 0 || stats.failedJobRuns > 0;
        const hasIssues = stats.staleAssets > 0;
        const isHealthy = !isUnhealthy && !hasIssues;
        
        return (
          <div 
            key={`${stats.name}::${stats.repositoryName}`}
            className="relative bg-color-background-default border rounded-lg p-6 hover:border-color-border-hover transition-all duration-200 cursor-pointer"
            style={{
              borderColor: isUnhealthy ? 'var(--color-accent-error)' : hasIssues ? 'var(--color-accent-warn)' : 'var(--color-accent-success)',
              backgroundColor: isUnhealthy ? 'rgba(var(--color-accent-error-rgb), 0.02)' : hasIssues ? 'rgba(var(--color-accent-warn-rgb), 0.02)' : 'rgba(var(--color-accent-success-rgb), 0.02)',
              borderLeft: `4px solid ${getCodeLocationColor(stats.name)}`
            }}
            title={`${stats.name} - ${stats.totalAssets} assets, ${stats.healthyAssets} healthy, ${stats.failedMaterializations} failed`}
          >
            {/* Status indicator dot */}
            <div 
              className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${(stats.runningJobRuns > 0 || isUnhealthy) ? 'animate-pulse' : ''}`}
              style={{
                backgroundColor: isUnhealthy ? 'var(--color-accent-error)' : hasIssues ? 'var(--color-accent-warn)' : 'var(--color-accent-success)'
              }}
            />
            
            {/* Code location name with identifier color accent */}
            <div className="pr-6 mb-4 flex items-center space-x-2">
              {/* <div 
                className="w-3 h-3 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getCodeLocationColor(stats.name) }}
                title={`Code location: ${stats.name}`}
              /> */}
              <h3 className="text-base font-semibold text-color-text-default">
                {stats.name}
              </h3>
            </div>

            {/* Compact metrics */}
            <div className="space-y-3">
              {/* Assets row */}
              <div>
                <div className="text-xs text-color-text-lighter mb-1 font-medium">Assets</div>
                <div className="flex items-center justify-between">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon 
                        className="w-4 h-4" 
                        style={{ color: 'var(--color-accent-success)' }}
                        title="Healthy assets (materialized within 24 hours)"
                      />
                      <span 
                        className="font-medium" 
                        style={{ color: 'var(--color-accent-success)' }}
                        title={`${stats.healthyAssets} assets with successful materializations in the last 24 hours`}
                      >
                        {stats.healthyAssets}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <XCircleIcon 
                        className="w-4 h-4" 
                        style={{ color: 'var(--color-accent-error)' }}
                        title="Assets with failed latest materialization"
                      />
                      <span 
                        className="font-medium" 
                        style={{ color: 'var(--color-accent-error)' }}
                        title={`${stats.failedMaterializations} assets where the most recent materialization failed`}
                      >
                        {stats.failedMaterializations}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon 
                        className="w-4 h-4" 
                        style={{ color: 'var(--color-accent-warn)' }}
                        title="Stale/Warning assets or assets without freshness policies"
                      />
                      <span 
                        className="font-medium" 
                        style={{ color: 'var(--color-accent-warn)' }}
                        title={`${stats.staleAssets} assets that are stale according to their freshness policy`}
                      >
                        {stats.staleAssets}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon 
                        className={`w-4 h-4 ${stats.runningAssets > 0 ? 'animate-pulse' : ''}`}
                        style={{ color: 'var(--color-accent-blue)' }}
                        title="Assets currently being materialized"
                      />
                      <span 
                        className={`font-medium ${stats.runningAssets > 0 ? 'animate-pulse' : ''}`}
                        style={{ color: 'var(--color-accent-blue)' }}
                        title={`${stats.runningAssets} assets currently being materialized`}
                      >
                        {stats.runningAssets}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              </div>

              {/* Job runs row */}
              <div className="pt-3 border-t border-color-border">
                <div className="text-xs text-color-text-lighter mb-1 font-medium">Job Runs</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <CheckCircleIcon 
                        className="w-4 h-4" 
                        style={{ color: 'var(--color-accent-success)' }}
                        title="Successful job runs"
                      />
                      <span 
                        className="font-medium" 
                        style={{ color: 'var(--color-accent-success)' }}
                        title={`${stats.successfulJobRuns} job runs completed successfully`}
                      >
                        {stats.successfulJobRuns}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <XCircleIcon 
                        className="w-4 h-4" 
                        style={{ color: 'var(--color-accent-error)' }}
                        title="Failed job runs"
                      />
                      <span 
                        className="font-medium" 
                        style={{ color: 'var(--color-accent-error)' }}
                        title={`${stats.failedJobRuns} job runs failed with errors`}
                      >
                        {stats.failedJobRuns}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ClockIcon 
                        className={`w-4 h-4 ${stats.runningJobRuns > 0 ? 'animate-pulse' : ''}`}
                        style={{ color: 'var(--color-accent-blue)' }}
                        title="Running job runs"
                      />
                      <span 
                        className={`font-medium ${stats.runningJobRuns > 0 ? 'animate-pulse' : ''}`}
                        style={{ color: 'var(--color-accent-blue)' }}
                        title={`${stats.runningJobRuns} job runs currently in progress`}
                      >
                        {stats.runningJobRuns}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};