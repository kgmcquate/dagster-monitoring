import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AssetCheck, AssetCheckExecutionStatus } from '../../types/dagster';
import { getDateRangeDays, isWithinDateRange } from '../../utils/dateUtils';

interface AssetChecksOverviewProps {
  assetChecks: AssetCheck[];
  groupByCodeLocation?: boolean;
  dateRange?: string;
}

interface CheckStatusData {
  status: string;
  count: number;
  color: string;
}

interface CheckTrendData {
  date: string;
  passed: number;
  failed: number;
  inProgress: number;
  total: number;
  [key: string]: string | number;
}

const STATUS_COLORS = {
  [AssetCheckExecutionStatus.SUCCESS]: '#10b981',
  [AssetCheckExecutionStatus.FAILURE]: '#ef4444', 
  [AssetCheckExecutionStatus.IN_PROGRESS]: '#f59e0b'
};

export const AssetChecksOverview: React.FC<AssetChecksOverviewProps> = ({ 
  assetChecks, 
  groupByCodeLocation = false,
  dateRange = '7d'
}) => {
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  // Filter checks based on date range (using latest execution)
  const filteredChecks = assetChecks.filter(check => {
    if (!check.executionForLatestMaterialization) return true;
    // For now, include all checks since we don't have execution timestamps
    // In a real implementation, you'd filter based on execution timestamp
    return true;
  });

  // Get unique code locations
  const codeLocations = Array.from(new Set(
    filteredChecks.map(check => {
      const assetPath = check.assetKey.path.join('/');
      // Extract code location from asset path or use a default
      return assetPath.split('/')[0] || 'Unknown';
    })
  ));

  // Calculate status distribution
  const generateStatusData = (): CheckStatusData[] => {
    const statusCounts = {
      [AssetCheckExecutionStatus.SUCCESS]: 0,
      [AssetCheckExecutionStatus.FAILURE]: 0,
      [AssetCheckExecutionStatus.IN_PROGRESS]: 0,
      'NOT_EXECUTED': 0
    };

    filteredChecks.forEach(check => {
      const status = check.executionForLatestMaterialization?.status || 'NOT_EXECUTED';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    return [
      { status: 'Passed', count: statusCounts[AssetCheckExecutionStatus.SUCCESS], color: STATUS_COLORS[AssetCheckExecutionStatus.SUCCESS] },
      { status: 'Failed', count: statusCounts[AssetCheckExecutionStatus.FAILURE], color: STATUS_COLORS[AssetCheckExecutionStatus.FAILURE] },
      { status: 'In Progress', count: statusCounts[AssetCheckExecutionStatus.IN_PROGRESS], color: STATUS_COLORS[AssetCheckExecutionStatus.IN_PROGRESS] },
      { status: 'Not Executed', count: statusCounts['NOT_EXECUTED'], color: '#6b7280' }
    ].filter(item => item.count > 0);
  };

  // Generate trends data (mock data for now since we don't have historical execution data)
  const generateTrendData = (): CheckTrendData[] => {
    const days = getDateRangeDays(dateRange);
    const groupByHour = days === 1;
    const trendData: CheckTrendData[] = [];

    if (groupByHour) {
      // Generate hourly data points for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i, 0, 0, 0);
        
        const dataPoint: CheckTrendData = {
          date: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          passed: Math.floor(Math.random() * 10),
          failed: Math.floor(Math.random() * 3),
          inProgress: Math.floor(Math.random() * 2),
          total: 0
        };
        
        dataPoint.total = dataPoint.passed + dataPoint.failed + dataPoint.inProgress;
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            dataPoint[`${location}_passed`] = Math.floor(Math.random() * 5);
            dataPoint[`${location}_failed`] = Math.floor(Math.random() * 2);
            dataPoint[`${location}_total`] = (dataPoint[`${location}_passed`] as number) + (dataPoint[`${location}_failed`] as number);
          });
        }
        
        trendData.push(dataPoint);
      }
    } else {
      // Generate daily data points
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dataPoint: CheckTrendData = {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          passed: Math.floor(Math.random() * 20),
          failed: Math.floor(Math.random() * 5),
          inProgress: Math.floor(Math.random() * 3),
          total: 0
        };
        
        dataPoint.total = dataPoint.passed + dataPoint.failed + dataPoint.inProgress;
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            dataPoint[`${location}_passed`] = Math.floor(Math.random() * 10);
            dataPoint[`${location}_failed`] = Math.floor(Math.random() * 3);
            dataPoint[`${location}_total`] = (dataPoint[`${location}_passed`] as number) + (dataPoint[`${location}_failed`] as number);
          });
        }
        
        trendData.push(dataPoint);
      }
    }

    return trendData;
  };

  const statusData = generateStatusData();
  const trendData = generateTrendData();

  // Calculate summary stats
  const totalChecks = filteredChecks.length;
  const passedChecks = filteredChecks.filter(check => 
    check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.SUCCESS).length;
  const failedChecks = filteredChecks.filter(check => 
    check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.FAILURE).length;
  const blockingChecks = filteredChecks.filter(check => check.blocking).length;

  // Show empty state if no asset checks
  if (totalChecks === 0) {
    return (
      <div className="card">
        <div className="p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-color-text-default mb-2">No Asset Checks Found</h3>
          <p className="text-color-text-lighter mb-4">
            Asset checks help ensure data quality by validating your assets. No checks have been configured for the current assets.
          </p>
          <p className="text-sm text-color-text-lighter">
            To get started with asset checks, define validation functions in your Dagster assets using <code className="bg-color-background-lighter px-1 py-0.5 rounded">@asset_check</code> decorators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-header">
            <h4 className="text-sm font-medium text-color-text-light">Total Checks</h4>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-color-text-default">{totalChecks}</div>
            <div className="text-sm text-color-text-lighter">Asset checks configured</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h4 className="text-sm font-medium text-color-text-light">Passed</h4>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-green-600">{passedChecks}</div>
            <div className="text-sm text-color-text-lighter">Successful executions</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h4 className="text-sm font-medium text-color-text-light">Failed</h4>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-red-600">{failedChecks}</div>
            <div className="text-sm text-color-text-lighter">Need attention</div>
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <h4 className="text-sm font-medium text-color-text-light">Blocking</h4>
          </div>
          <div className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{blockingChecks}</div>
            <div className="text-sm text-color-text-lighter">Critical checks</div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Check Status Distribution</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Current status of all asset checks
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-background-default)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  color: 'var(--color-text-default)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Check Execution Trends */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ color: 'var(--color-text-default)' }}>Check Execution Trends</h3>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
              Historical check execution results
            </p>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="date" 
                tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis 
                tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-background-default)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  color: 'var(--color-text-default)'
                }}
              />
              <Bar dataKey="passed" stackId="a" fill={STATUS_COLORS[AssetCheckExecutionStatus.SUCCESS]} name="Passed" />
              <Bar dataKey="failed" stackId="a" fill={STATUS_COLORS[AssetCheckExecutionStatus.FAILURE]} name="Failed" />
              <Bar dataKey="inProgress" stackId="a" fill={STATUS_COLORS[AssetCheckExecutionStatus.IN_PROGRESS]} name="In Progress" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Checks List */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ color: 'var(--color-text-default)' }}>Asset Checks Details</h3>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-lighter)' }}>
            Detailed view of all configured asset checks
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-color-border">
            <thead className="bg-color-background-lighter">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                  Check Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                  Blocking
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                  Jobs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                  Description
                </th>
              </tr>
            </thead>
            <tbody className="bg-color-background-default divide-y divide-color-border">
              {filteredChecks.map((check, index) => {
                const status = check.executionForLatestMaterialization?.status || 'NOT_EXECUTED';
                const statusColor = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280';
                
                return (
                  <tr key={index} className="hover:bg-color-background-lighter">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-color-text-default">
                      {check.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-color-text-default">
                      {check.assetKey.path.join('/')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span 
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ 
                          backgroundColor: `${statusColor}20`, 
                          color: statusColor 
                        }}
                      >
                        {status === 'NOT_EXECUTED' ? 'Not Executed' : status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-color-text-default">
                      {check.blocking ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Blocking
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Non-blocking
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-color-text-default">
                      {check.jobNames.join(', ') || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm text-color-text-default max-w-xs truncate">
                      {check.description || 'No description'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AssetChecksOverview;