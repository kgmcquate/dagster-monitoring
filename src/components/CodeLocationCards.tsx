import React from 'react';
import { Asset, JobRun, RunStatus, AssetHealthStatus, FreshnessStatus } from '../types/dagster';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

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
  totalJobRuns: number;
  successfulJobRuns: number;
  failedJobRuns: number;
  runningJobRuns: number;
  recentActivity: number;
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
        return AssetHealthStatus.MISSING;
      case FreshnessStatus.NOT_APPLICABLE:
        return AssetHealthStatus.STALE; // Show as neutral/stale for not applicable
      default:
        return AssetHealthStatus.MISSING;
    }
  }

  // For assets without freshness policies, show as NOT_APPLICABLE (stale color but different meaning)
  return AssetHealthStatus.STALE;
}

export const CodeLocationCards: React.FC<CodeLocationCardsProps> = ({ assets, jobRuns }) => {
  // Group assets and job runs by code location
  const codeLocationStats = React.useMemo(() => {
    console.log('CodeLocationCards processing:', assets.length, 'assets,', jobRuns.length, 'job runs');

    try {
      const statsMap = new Map<string, CodeLocationStats>();

      // Process assets
      assets.forEach(asset => {
        const codeLocation = (asset.definition?.repository?.location?.name || 'Unknown').trim();
        let repositoryName = (asset.definition?.repository?.name || '__repository__').trim();
        
        // Normalize repository name to match job runs format
        if (repositoryName === 'Unknown' || !repositoryName) {
          repositoryName = '__repository__';
        }
        
        // Normalize the key to avoid case sensitivity or whitespace issues
        const key = `${codeLocation.toLowerCase()}::${repositoryName.toLowerCase()}`;
        
        console.log(`Asset ${asset.id}: location="${codeLocation}", repo="${repositoryName}", key="${key}"`);

        if (!statsMap.has(key)) {
          statsMap.set(key, {
            name: codeLocation, // Use original case for display
            repositoryName,     // Use original case for display
            totalAssets: 0,
          healthyAssets: 0,
          staleAssets: 0,
          missingAssets: 0,
          failedMaterializations: 0,
          totalJobRuns: 0,
          successfulJobRuns: 0,
          failedJobRuns: 0,
          runningJobRuns: 0,
          recentActivity: 0
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

      // Count recent activity (last 24 hours)
      const lastMat = asset.assetMaterializations?.[0];
      if (lastMat) {
        const lastMatTime = new Date(parseFloat(lastMat.timestamp));
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        if (lastMatTime > oneDayAgo) {
          stats.recentActivity++;
        }
      }
    });

      // Process job runs with enhanced safety checks
      jobRuns.forEach((run, index) => {
        if (!run || typeof run !== 'object') {
          console.warn(`Job run ${index} is not a valid object:`, run);
          return;
        }
        
        // Enhanced safety check for repositoryOrigin
        let codeLocation = 'Unknown';
        let repositoryName = 'Unknown';
        
        if (run.repositoryOrigin && typeof run.repositoryOrigin === 'object') {
          codeLocation = (run.repositoryOrigin.repositoryLocationName || 'Unknown').trim();
          repositoryName = (run.repositoryOrigin.repositoryName || '__repository__').trim();
        } else {
          console.warn('Job run missing or invalid repositoryOrigin:', run);
          // Use pipeline name as fallback for grouping
          codeLocation = (run.pipelineName || 'Unknown').trim();
          repositoryName = '__repository__';
        }
        
        // Normalize repository name to be consistent
        if (repositoryName === 'Unknown' || !repositoryName) {
          repositoryName = '__repository__';
        }
        
        // Normalize the key to match the asset processing
        const key = `${codeLocation.toLowerCase()}::${repositoryName.toLowerCase()}`;
        
        console.log(`Job run ${run.id}: location="${codeLocation}", repo="${repositoryName}", key="${key}"`);

        if (!statsMap.has(key)) {
          statsMap.set(key, {
            name: codeLocation, // Use original case for display
            repositoryName,     // Use original case for display  
            totalAssets: 0,
          healthyAssets: 0,
          staleAssets: 0,
          missingAssets: 0,
          failedMaterializations: 0,
          totalJobRuns: 0,
          successfulJobRuns: 0,
          failedJobRuns: 0,
          runningJobRuns: 0,
          recentActivity: 0
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

      console.log('Final stats map keys:', Array.from(statsMap.keys()));
      const result = Array.from(statsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      console.log('Code location cards to render:', result.length);
      return result;
    } catch (error) {
      console.error('Error processing code location stats:', error);
      return [];
    }
  }, [assets, jobRuns]);

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
            className={`
              relative bg-color-background-default border rounded-lg p-6 hover:border-color-border-hover transition-all duration-200 cursor-pointer
              ${isUnhealthy ? 'border-red-500 bg-red-50/5' : hasIssues ? 'border-yellow-500 bg-yellow-50/5' : 'border-green-500 bg-green-50/5'}
            `}
            title={`${stats.name} - ${stats.totalAssets} assets, ${stats.healthyAssets} healthy, ${stats.failedMaterializations} failed`}
          >
            {/* Status indicator dot */}
            <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${
              isUnhealthy ? 'bg-red-500' : hasIssues ? 'bg-yellow-500' : 'bg-green-500'
            } ${stats.runningJobRuns > 0 ? 'animate-pulse' : ''}`} />
            
            {/* Code location name */}
            <div className="pr-6 mb-4">
              <h3 className="text-base font-semibold text-color-text-default truncate">
                {stats.name}
              </h3>
            </div>

            {/* Compact metrics */}
            <div className="space-y-3">
              {/* Assets row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span 
                    className="text-color-text-lighter font-medium" 
                    title={`Total assets in ${stats.name}`}
                  >
                    {stats.totalAssets}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {stats.healthyAssets > 0 && (
                    <>
                      <CheckCircleIcon 
                        className="w-4 h-4 text-green-500" 
                        title="Healthy assets (materialized within 24 hours)"
                      />
                      <span 
                        className="text-green-500 font-medium" 
                        title={`${stats.healthyAssets} assets with successful materializations in the last 24 hours`}
                      >
                        {stats.healthyAssets}
                      </span>
                    </>
                  )}
                  {stats.failedMaterializations > 0 && (
                    <>
                      <XCircleIcon 
                        className="w-4 h-4 text-red-500" 
                        title="Assets with failed latest materialization"
                      />
                      <span 
                        className="text-red-500 font-medium" 
                        title={`${stats.failedMaterializations} assets where the most recent materialization failed`}
                      >
                        {stats.failedMaterializations}
                      </span>
                    </>
                  )}
                  {stats.staleAssets > 0 && (
                    <>
                      <ClockIcon 
                        className="w-4 h-4 text-yellow-500" 
                        title="Stale/Warning assets or assets without freshness policies"
                      />
                      <span 
                        className="text-yellow-500 font-medium" 
                        title={`${stats.staleAssets} assets that are stale according to their freshness policy, have warning/degraded status, or don't have freshness policies configured`}
                      >
                        {stats.staleAssets}
                      </span>
                    </>
                  )}
                  {stats.missingAssets > 0 && stats.failedMaterializations === 0 && (
                    <>
                      <XCircleIcon 
                        className="w-4 h-4 text-gray-500" 
                        title="Assets with no materializations"
                      />
                      <span 
                        className="text-gray-500 font-medium" 
                        title={`${stats.missingAssets} assets that have never been materialized`}
                      >
                        {stats.missingAssets}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Job runs row (if any) */}
              {stats.totalJobRuns > 0 && (
                <div className="flex items-center justify-between pt-3 border-t border-color-border">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                    <span 
                      className="text-color-text-lighter font-medium" 
                      title={`Total job runs from ${stats.name} in recent history`}
                    >
                      {stats.totalJobRuns}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {stats.successfulJobRuns > 0 && (
                      <span 
                        className="text-green-500 font-medium" 
                        title={`${stats.successfulJobRuns} job runs completed successfully`}
                      >
                        {stats.successfulJobRuns}
                      </span>
                    )}
                    {stats.failedJobRuns > 0 && (
                      <span 
                        className="text-red-500 font-medium" 
                        title={`${stats.failedJobRuns} job runs failed with errors`}
                      >
                        {stats.failedJobRuns}
                      </span>
                    )}
                    {stats.runningJobRuns > 0 && (
                      <span 
                        className="text-blue-500 font-medium animate-pulse" 
                        title={`${stats.runningJobRuns} job runs currently in progress`}
                      >
                        {stats.runningJobRuns}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              {/* Recent activity indicator */}
              {stats.recentActivity > 0 && (
                <div className="pt-2">
                  <div className="text-sm text-color-text-lighter flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span 
                      className="font-medium" 
                      title={`${stats.recentActivity} assets were updated in the last 24 hours`}
                    >
                      {stats.recentActivity} recent
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};