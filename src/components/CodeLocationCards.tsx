import React from 'react';
import { Asset, JobRun, RunStatus, AssetHealthStatus } from '../types/dagster';
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
  if (!asset.assetMaterializations || asset.assetMaterializations.length === 0) {
    return AssetHealthStatus.MISSING;
  }

  const lastMaterialization = asset.assetMaterializations[0];
  
  // If the latest materialization failed, the asset is considered failed/missing
  if (lastMaterialization.stepStats?.status === 'FAILURE') {
    return AssetHealthStatus.MISSING;
  }
  
  const timestamp = parseFloat(lastMaterialization.timestamp);
  const lastMaterializationTime = new Date(timestamp);
  const now = new Date();
  const hoursSinceLastMaterialization = (now.getTime() - lastMaterializationTime.getTime()) / (1000 * 60 * 60);

  if (hoursSinceLastMaterialization < 24) {
    return AssetHealthStatus.FRESH;
  } else {
    return AssetHealthStatus.STALE;
  }
}

export const CodeLocationCards: React.FC<CodeLocationCardsProps> = ({ assets, jobRuns }) => {
  // Group assets and job runs by code location
  const codeLocationStats = React.useMemo(() => {
    const statsMap = new Map<string, CodeLocationStats>();

    // Process assets
    assets.forEach(asset => {
      const codeLocation = asset.definition?.repository?.location?.name || 'Unknown';
      const repositoryName = asset.definition?.repository?.name || 'Unknown';
      const key = `${codeLocation}::${repositoryName}`;

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          name: codeLocation,
          repositoryName,
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

    // Process job runs
    jobRuns.forEach(run => {
      const codeLocation = run.repositoryOrigin.repositoryLocationName;
      const repositoryName = run.repositoryOrigin.repositoryName;
      const key = `${codeLocation}::${repositoryName}`;

      if (!statsMap.has(key)) {
        statsMap.set(key, {
          name: codeLocation,
          repositoryName,
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

    return Array.from(statsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {codeLocationStats.map((stats) => {
        // Determine overall health status
        const isUnhealthy = stats.failedMaterializations > 0 || stats.failedJobRuns > 0;
        const hasIssues = stats.staleAssets > 0;
        const isHealthy = !isUnhealthy && !hasIssues;
        
        return (
          <div 
            key={`${stats.name}::${stats.repositoryName}`}
            className={`
              relative bg-color-background-default border rounded-lg p-4 hover:border-color-border-hover transition-all duration-200 cursor-pointer
              ${isUnhealthy ? 'border-red-500 bg-red-50/5' : hasIssues ? 'border-yellow-500 bg-yellow-50/5' : 'border-green-500 bg-green-50/5'}
            `}
            title={`${stats.name} - ${stats.totalAssets} assets, ${stats.healthyAssets} healthy, ${stats.failedMaterializations} failed`}
          >
            {/* Status indicator dot */}
            <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${
              isUnhealthy ? 'bg-red-500' : hasIssues ? 'bg-yellow-500' : 'bg-green-500'
            } ${stats.runningJobRuns > 0 ? 'animate-pulse' : ''}`} />
            
            {/* Code location name */}
            <div className="pr-6 mb-3">
              <h3 className="text-sm font-medium text-color-text-default truncate">
                {stats.name}
              </h3>
            </div>

            {/* Compact metrics */}
            <div className="space-y-2">
              {/* Assets row */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                  <span 
                    className="text-color-text-lighter" 
                    title={`Total assets in ${stats.name}`}
                  >
                    {stats.totalAssets}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  {stats.healthyAssets > 0 && (
                    <>
                      <CheckCircleIcon 
                        className="w-3.5 h-3.5 text-green-500" 
                        title="Healthy assets (materialized within 24 hours)"
                      />
                      <span 
                        className="text-green-500" 
                        title={`${stats.healthyAssets} assets with successful materializations in the last 24 hours`}
                      >
                        {stats.healthyAssets}
                      </span>
                    </>
                  )}
                  {stats.failedMaterializations > 0 && (
                    <>
                      <XCircleIcon 
                        className="w-3.5 h-3.5 text-red-500" 
                        title="Assets with failed latest materialization"
                      />
                      <span 
                        className="text-red-500" 
                        title={`${stats.failedMaterializations} assets where the most recent materialization failed`}
                      >
                        {stats.failedMaterializations}
                      </span>
                    </>
                  )}
                  {stats.staleAssets > 0 && (
                    <>
                      <ClockIcon 
                        className="w-3.5 h-3.5 text-yellow-500" 
                        title="Stale assets (last materialized >24 hours ago)"
                      />
                      <span 
                        className="text-yellow-500" 
                        title={`${stats.staleAssets} assets that were last successfully materialized more than 24 hours ago`}
                      >
                        {stats.staleAssets}
                      </span>
                    </>
                  )}
                  {stats.missingAssets > 0 && stats.failedMaterializations === 0 && (
                    <>
                      <XCircleIcon 
                        className="w-3.5 h-3.5 text-gray-500" 
                        title="Assets with no materializations"
                      />
                      <span 
                        className="text-gray-500" 
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
                <div className="flex items-center justify-between text-sm pt-2 border-t border-color-border">
                  <div className="flex items-center space-x-1.5">
                    <div className="w-2.5 h-2.5 bg-purple-500 rounded-full" />
                    <span 
                      className="text-color-text-lighter" 
                      title={`Total job runs from ${stats.name} in recent history`}
                    >
                      {stats.totalJobRuns}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    {stats.successfulJobRuns > 0 && (
                      <span 
                        className="text-green-500" 
                        title={`${stats.successfulJobRuns} job runs completed successfully`}
                      >
                        {stats.successfulJobRuns}
                      </span>
                    )}
                    {stats.failedJobRuns > 0 && (
                      <span 
                        className="text-red-500" 
                        title={`${stats.failedJobRuns} job runs failed with errors`}
                      >
                        {stats.failedJobRuns}
                      </span>
                    )}
                    {stats.runningJobRuns > 0 && (
                      <span 
                        className="text-blue-500 animate-pulse" 
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
                <div className="pt-1">
                  <div className="text-xs text-color-text-lighter flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span 
                      className="" 
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