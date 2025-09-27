import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS } from '../graphql/queries';
import { Asset, AssetHealthStatus, JobRun, RunStatus, FreshnessStatus, AssetCheck } from '../types/dagster';
import { AssetsOverviewResponse } from '../types/graphql';
import StatsCard from './StatsCard';
import AssetHealthChart from './AssetHealthChart';
import SuccessFailureTrendsChart from './SuccessFailureTrendsChart';
import ObservationsActivityChart from './ObservationsActivityChart';
import PerformanceMetricsChart from './PerformanceMetricsChart';
import { JobRunsChart } from './JobRunsChart';
import { JobPerformanceMetrics } from './JobPerformanceMetrics';
import { CodeLocationCards } from './CodeLocationCards';
import DashboardFilters from './DashboardFilters';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import AssetChecksOverview from './AssetChecksOverview';
import { filterAssetsByDateRange, isWithinDateRange } from '../utils/dateUtils';

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
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('7d');
  const [groupByCodeLocation, setGroupByCodeLocation] = useState(true);

  const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_DASHBOARD_STATS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  // For now, provide empty array for asset checks - this can be enhanced later
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
  
  // Filter assets based on selected groups and date range
  const filteredAssets = allAssets.filter(asset => {
    if (selectedGroups.length === 0) return true;
    const assetGroup = asset.definition?.groupName || 'Unknown';
    return selectedGroups.includes(assetGroup);
  });
  
  // Apply date range filtering to the assets
  const dateFilteredAssets = filterAssetsByDateRange(filteredAssets, dateRange);
  
  // Calculate dashboard statistics for filtered assets
  const totalAssets = filteredAssets.length;
  const healthyAssets = filteredAssets.filter(asset => getAssetStatus(asset) === AssetHealthStatus.FRESH).length;
  const staleAssets = filteredAssets.filter(asset => getAssetStatus(asset) === AssetHealthStatus.STALE).length;
  const missingAssets = filteredAssets.filter(asset => getAssetStatus(asset) === AssetHealthStatus.MISSING).length;
  
  const recentMaterializations = filteredAssets.filter(asset => {
    const lastMat = asset.assetMaterializations?.[0];
    if (!lastMat) return false;
    const lastMatTime = new Date(parseFloat(lastMat.timestamp));
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return lastMatTime > oneDayAgo;
  }).length;

  const failedMaterializations = filteredAssets.filter(asset => {
    const lastMat = asset.assetMaterializations?.[0];
    return lastMat?.stepStats?.status === 'FAILURE';
  }).length;

  // Calculate observations stats
  const totalObservations = filteredAssets.reduce((total, asset) => 
    total + (asset.assetObservations?.length || 0), 0);
  
  const criticalObservations = filteredAssets.reduce((total, asset) => 
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
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-default)' }}>Analytics Dashboard</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-light)' }}>
          Comprehensive overview of asset health, performance, and activity trends
        </p>
      </div>

      {/* Code Locations - Compact Cards at Top */}
      <div>
        <h3 className="text-sm font-medium text-color-text-lighter mb-3">Code Locations</h3>
        <CodeLocationCards assets={allAssets} jobRuns={dateFilteredJobRuns} />
      </div>

      {/* Filters and Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <DashboardFilters
            assets={allAssets}
            selectedGroups={selectedGroups}
            onGroupsChange={setSelectedGroups}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
        
        <div className="lg:col-span-3">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-4 mb-6">
            <StatsCard
              title="Total Assets"
              value={totalAssets}
              subtitle="Filtered assets"
              color="blue"
            />
            <StatsCard
              title="Healthy"
              value={healthyAssets}
              subtitle="Fresh & up-to-date"
              color="green"
            />
            <StatsCard
              title="Job Runs"
              value={totalJobRuns}
              subtitle={`${runningJobRuns} running`}
              color="blue"
            />
            <StatsCard
              title="Successful"
              value={successfulJobRuns}
              subtitle="Job runs"
              color="green"
            />
            <StatsCard
              title="Failed"
              value={failedJobRuns}
              subtitle="Need attention"
              color="red"
            />
            <StatsCard
              title="Observations"
              value={totalObservations}
              subtitle={`${criticalObservations} critical`}
              color="yellow"
            />
            <StatsCard
              title="Asset Checks"
              value={totalAssetChecks}
              subtitle={`${failedChecks} failed`}
              color="blue"
            />
          </div>
        </div>
      </div>

      {/* Chart Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-default)' }}>Analytics Charts</h2>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={groupByCodeLocation}
              onChange={(e) => setGroupByCodeLocation(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-default)' }}>
              Group by Code Location
            </span>
          </label>
        </div>
      </div>

      {/* Success/Failure Trends - Full Width */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ color: 'var(--color-text-default)' }}>Success/Failure Trends</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
            Daily materialization success and failure rates
          </p>
        </div>
        <SuccessFailureTrendsChart assets={dateFilteredAssets} groupByCodeLocation={groupByCodeLocation} dateRange={dateRange} />
      </div>

      {/* Observations Activity - Full Width */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ color: 'var(--color-text-default)' }}>Observations Activity</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
            Timeline of asset observations and alerts
          </p>
        </div>
        <ObservationsActivityChart assets={dateFilteredAssets} groupByCodeLocation={groupByCodeLocation} dateRange={dateRange} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Metrics */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Performance Metrics</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Duration vs success rate by asset
            </p>
          </div>
          <PerformanceMetricsChart assets={dateFilteredAssets} groupByCodeLocation={groupByCodeLocation} dateRange={dateRange} />
        </div>

        {/* Classic Health Chart */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Asset Health Distribution</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Current health status breakdown
            </p>
          </div>
          <AssetHealthChart 
            healthy={healthyAssets}
            stale={staleAssets}
            missing={missingAssets}
            assets={dateFilteredAssets}
            groupByCodeLocation={groupByCodeLocation}
            getAssetStatus={getAssetStatus}
          />
        </div>
      </div>

      {/* Job Runs Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-default)' }}>Job Runs Monitoring</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Runs Timeline */}
          <JobRunsChart 
            runs={dateFilteredJobRuns} 
            type="timeline"
            title={`Job Runs Timeline (${dateRange.toUpperCase()})`}
            dateRange={dateRange}
          />

          {/* Job Status Distribution */}
          <JobRunsChart 
            runs={dateFilteredJobRuns} 
            type="status-distribution"
            title="Job Status Distribution"
            dateRange={dateRange}
          />

          {/* Job Performance - Duration Trend */}
          <JobPerformanceMetrics 
            runs={dateFilteredJobRuns} 
            type="duration-trend"
            title="Job Duration Trends"
            dateRange={dateRange}
          />

          {/* Job Performance - Success Rate */}
          <JobPerformanceMetrics 
            runs={dateFilteredJobRuns} 
            type="success-rate"
            title="Job Success Rate Over Time"
            dateRange={dateRange}
          />
        </div>
      </div>

      {/* Asset Checks Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-default)' }}>Asset Checks</h2>
        <AssetChecksOverview 
          assetChecks={allAssetChecks}
          groupByCodeLocation={groupByCodeLocation}
          dateRange={dateRange}
        />
      </div>
    </div>
  );
}