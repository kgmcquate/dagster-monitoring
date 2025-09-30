import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS } from '../../graphql/queries';
import { Asset, AssetHealthStatus, JobRun, RunStatus, FreshnessStatus, AssetCheck } from '../../types/dagster';
import { AssetsOverviewResponse } from '../../types/graphql';
import { LoadingSpinner, ErrorMessage, DashboardControlsBar, CodeLocationCards, CollapsibleCard } from '../ui';
import { 
  AssetHealthChart, 
  SuccessFailureTrendsChart, 
  ObservationsActivityChart, 
  PerformanceMetricsChart,
  JobRunsChart,
  JobPerformanceMetrics,
  AssetChecksChart
} from '../charts';
import AssetChecksOverview from './AssetChecksOverview';
import { filterAssetsByDateRange, isWithinDateRange } from '../../utils/dateUtils';

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
        return AssetHealthStatus.MISSING; // Show as neutral/stale for not applicable
      default:
        return AssetHealthStatus.MISSING;
    }
  }

  // For assets without freshness policies, show as NOT_APPLICABLE (stale color but different meaning)
  return AssetHealthStatus.STALE;
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState('1d');
  const [groupByCodeLocation, setGroupByCodeLocation] = useState(true);

  const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_DASHBOARD_STATS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  // For now, provide empty array for asset checks to avoid blocking the dashboard
  const allAssetChecks: AssetCheck[] = [];

  if (loading) return <LoadingSpinner />;
  if (error) {
    console.error('GraphQL Error:', error);
    return <ErrorMessage error={error} />;
  }

  // Add safety checks for data structure
  console.log('Dashboard data:', data);
  
  const allAssets: Asset[] = data?.assetsOrError?.nodes || [];
  // Safely extract job runs with additional validation
  let allJobRuns: JobRun[] = [];
  try {
    if (data?.runsOrError?.results && Array.isArray(data.runsOrError.results)) {
      allJobRuns = data.runsOrError.results.filter(run => run && typeof run === 'object');
    }
  } catch (error) {
    console.error('Error processing job runs data:', error);
    allJobRuns = [];
  }

  console.log('Dashboard data loaded:', {
    assets: allAssets.length,
    jobRuns: allJobRuns.length
  });  // Apply date range filtering to job runs
  const dateFilteredJobRuns = allJobRuns.filter(run => 
    run.startTime && isWithinDateRange(parseFloat(run.startTime) * 1000, dateRange)
  );
  
  // Apply date range filtering to the assets
  const dateFilteredAssets = filterAssetsByDateRange(allAssets, dateRange);
  
  // Calculate dashboard statistics for date filtered assets
  const totalAssets = dateFilteredAssets.length;
  const healthyAssets = dateFilteredAssets.filter(asset => getAssetStatus(asset) === AssetHealthStatus.FRESH).length;
  const staleAssets = dateFilteredAssets.filter(asset => getAssetStatus(asset) === AssetHealthStatus.STALE).length;
  const missingAssets = dateFilteredAssets.filter(asset => getAssetStatus(asset) === AssetHealthStatus.MISSING).length;
  
  const recentMaterializations = dateFilteredAssets.filter(asset => {
    const lastMat = asset.assetMaterializations?.[0];
    if (!lastMat) return false;
    const lastMatTime = new Date(parseFloat(lastMat.timestamp));
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return lastMatTime > oneDayAgo;
  }).length;

  const failedMaterializations = dateFilteredAssets.filter(asset => {
    const lastMat = asset.assetMaterializations?.[0];
    return lastMat?.stepStats?.status === 'FAILURE';
  }).length;

  // Calculate observations stats
  const totalObservations = dateFilteredAssets.reduce((total, asset) => 
    total + (asset.assetObservations?.length || 0), 0);
  
  const criticalObservations = dateFilteredAssets.reduce((total, asset) => 
    total + (asset.assetObservations?.filter(obs => 
      obs.level === 'CRITICAL' || obs.level === 'ERROR')?.length || 0), 0);

  // Calculate asset checks stats
  const totalAssetChecks = allAssetChecks.length;
  const passedChecks = allAssetChecks.filter(check => 
    check.executionForLatestMaterialization?.status === 'SUCCESS').length;
  const failedChecks = allAssetChecks.filter(check => 
    check.executionForLatestMaterialization?.status === 'FAILURE').length;

  // Calculate job runs stats using date filtered runs
  const totalJobRuns = dateFilteredJobRuns.length;
  const successfulJobRuns = dateFilteredJobRuns.filter(run => run.status === RunStatus.SUCCESS).length;
  const failedJobRuns = dateFilteredJobRuns.filter(run => run.status === RunStatus.FAILURE).length;
  const runningJobRuns = dateFilteredJobRuns.filter(run => 
    [RunStatus.STARTED, RunStatus.STARTING, RunStatus.QUEUED].includes(run.status)).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-default)' }}>
          Overview
        </h1>
      </div>

      <hr/>

      {/* Sticky Top Controls Bar */}
      <DashboardControlsBar
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
        groupByCodeLocation={groupByCodeLocation}
        onGroupByCodeLocationChange={setGroupByCodeLocation}
      />

      {/* Code Locations - Compact Cards at Top */}
      <div>
        <h2 className="text-xl font-bold text-color-text-lighter mb-6">Code Locations</h2>
        <CodeLocationCards assets={allAssets} jobRuns={dateFilteredJobRuns} />
      </div>

      <hr/>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-default)' }}>Asset Analytics</h2>
      </div>

      {/* Success/Failure Trends - Full Width */}
      <CollapsibleCard 
        title="Asset Materialization Trends"
      >
        <SuccessFailureTrendsChart assets={dateFilteredAssets} groupByCodeLocation={groupByCodeLocation} dateRange={dateRange} />
      </CollapsibleCard>

      {/* Observations Activity - Full Width */}
      <CollapsibleCard 
        title="Observations Activity"
      >
        <ObservationsActivityChart assets={dateFilteredAssets} groupByCodeLocation={groupByCodeLocation} dateRange={dateRange} />
      </CollapsibleCard>

      {/* Performance Metrics - Full Width */}
      <CollapsibleCard 
        title="Performance Metrics"
      >
        <PerformanceMetricsChart assets={dateFilteredAssets} groupByCodeLocation={groupByCodeLocation} dateRange={dateRange} />
      </CollapsibleCard>

      {/* Asset Health Distribution - Full Width */}
      <CollapsibleCard 
        title="Asset Health Distribution"
      >
        <AssetHealthChart 
          healthy={healthyAssets}
          stale={staleAssets}
          missing={missingAssets}
          assets={dateFilteredAssets}
          groupByCodeLocation={groupByCodeLocation}
          getAssetStatus={getAssetStatus}
        />
      </CollapsibleCard>

      <hr/>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-default)' }}>Job Runs Monitoring</h2>
      </div>

        {/* Job Runs Timeline - Full Width */}
        <CollapsibleCard 
          title="Job Runs Timeline"
        >
          <JobRunsChart 
            runs={dateFilteredJobRuns} 
            type="timeline"
            dateRange={dateRange}
            groupByCodeLocation={groupByCodeLocation}
          />
        </CollapsibleCard>        {/* Job Status Distribution - Full Width */}
        <CollapsibleCard 
          title="Job Status Distribution"
        >
          <JobRunsChart 
            runs={dateFilteredJobRuns} 
            type="status-distribution"
            dateRange={dateRange}
            groupByCodeLocation={groupByCodeLocation}
          />
        </CollapsibleCard>        {/* Job Duration Trends - Full Width */}
        <CollapsibleCard 
          title="Job Duration Trends"
        >
          <JobPerformanceMetrics 
            runs={dateFilteredJobRuns} 
            type="duration-trend"
            dateRange={dateRange}
          />
        </CollapsibleCard>        {/* Job Success Rate - Full Width */}
        <CollapsibleCard 
          title="Job Success Rate Over Time"
        >
          <JobPerformanceMetrics 
            runs={dateFilteredJobRuns} 
            type="success-rate"
            dateRange={dateRange}
          />
        </CollapsibleCard>      <hr/>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-default)' }}>Asset Checks</h2>
      </div>

      {/* Asset Checks Timeline - Full Width */}
      <CollapsibleCard 
        title="Asset Checks Status Trends"
      >
        <AssetChecksChart 
          assets={allAssets} 
          groupByCodeLocation={groupByCodeLocation} 
          dateRange={dateRange} 
        />
      </CollapsibleCard>
    </div>
  );
}