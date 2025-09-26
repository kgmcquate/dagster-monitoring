import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_DASHBOARD_STATS } from '../graphql/queries';
import { Asset, AssetHealthStatus, JobRun, RunStatus } from '../types/dagster';
import { AssetsOverviewResponse } from '../types/graphql';
import StatsCard from './StatsCard';
import AssetHealthChart from './AssetHealthChart';
import RecentMaterializationsChart from './RecentMaterializationsChart';
import SuccessFailureTrendsChart from './SuccessFailureTrendsChart';
import CodeLocationDistributionChart from './CodeLocationDistributionChart';
import ObservationsActivityChart from './ObservationsActivityChart';
import PerformanceMetricsChart from './PerformanceMetricsChart';
import { JobRunsChart } from './JobRunsChart';
import { JobPerformanceMetrics } from './JobPerformanceMetrics';
import { CodeLocationCards } from './CodeLocationCards';
import DashboardFilters from './DashboardFilters';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

function getAssetStatus(asset: Asset): AssetHealthStatus {
  if (!asset.assetMaterializations || asset.assetMaterializations.length === 0) {
    return AssetHealthStatus.MISSING;
  }

  const lastMaterialization = asset.assetMaterializations[0];
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

export default function Dashboard() {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState('7d');

  const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_DASHBOARD_STATS, {
    pollInterval: 30000, // Poll every 30 seconds
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const allAssets: Asset[] = data?.assetsOrError?.nodes || [];
  const allJobRuns: JobRun[] = data?.runsOrError?.results || [];
  
  // Filter assets based on selected groups
  const filteredAssets = allAssets.filter(asset => {
    if (selectedGroups.length === 0) return true;
    const assetGroup = asset.definition?.groupName || 'Unknown';
    return selectedGroups.includes(assetGroup);
  });
  
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

  // Calculate job runs stats
  const totalJobRuns = allJobRuns.length;
  const successfulJobRuns = allJobRuns.filter(run => run.status === RunStatus.SUCCESS).length;
  const failedJobRuns = allJobRuns.filter(run => run.status === RunStatus.FAILURE).length;
  const runningJobRuns = allJobRuns.filter(run => 
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
        <CodeLocationCards assets={allAssets} jobRuns={allJobRuns} />
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
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
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
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Success/Failure Trends */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Success/Failure Trends</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Daily materialization success and failure rates
            </p>
          </div>
          <SuccessFailureTrendsChart assets={filteredAssets} />
        </div>

        {/* Asset Groups Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Asset Groups Distribution</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Assets count by group/code location
            </p>
          </div>
          <CodeLocationDistributionChart assets={filteredAssets} />
        </div>

        {/* Observations Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Observations Activity</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Timeline of asset observations and alerts
            </p>
          </div>
          <ObservationsActivityChart assets={filteredAssets} />
        </div>

        {/* Performance Metrics */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Performance Metrics</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Duration vs success rate by asset
            </p>
          </div>
          <PerformanceMetricsChart assets={filteredAssets} />
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
          />
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Recent Materializations</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Timeline of recent asset updates
            </p>
          </div>
          <RecentMaterializationsChart assets={filteredAssets} />
        </div>
      </div>

      {/* Job Runs Section */}
      <div>
        <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text-default)' }}>Job Runs Monitoring</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Job Runs Timeline */}
          <JobRunsChart 
            runs={allJobRuns} 
            type="timeline"
            title="Job Runs Timeline (Last 24 Hours)"
          />

          {/* Job Status Distribution */}
          <JobRunsChart 
            runs={allJobRuns} 
            type="status-distribution"
            title="Job Status Distribution"
          />

          {/* Job Performance - Duration Trend */}
          <JobPerformanceMetrics 
            runs={allJobRuns} 
            type="duration-trend"
            title="Job Duration Trends"
          />

          {/* Job Performance - Success Rate */}
          <JobPerformanceMetrics 
            runs={allJobRuns} 
            type="success-rate"
            title="Job Success Rate Over Time"
          />
        </div>
      </div>
    </div>
  );
}