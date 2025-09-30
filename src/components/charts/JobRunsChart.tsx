import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { JobRun, RunStatus } from '../../types/dagster';
import { getDateRangeDays, isWithinDateRange } from '../../utils/dateUtils';
import { getCodeLocationColor } from '../../utils/codeLocationColors';

interface JobRunsChartProps {
  runs: JobRun[];
  type?: 'timeline' | 'status-distribution';
  dateRange?: string;
  groupByCodeLocation?: boolean;
}

const STATUS_COLORS = {
  [RunStatus.SUCCESS]: '#10b981',
  [RunStatus.FAILURE]: '#ef4444',
  [RunStatus.STARTED]: '#3b82f6',
  [RunStatus.QUEUED]: '#f59e0b',
  [RunStatus.CANCELED]: '#6b7280',
  [RunStatus.CANCELING]: '#f59e0b',
  [RunStatus.NOT_STARTED]: '#6b7280',
  [RunStatus.STARTING]: '#3b82f6',
  [RunStatus.MANAGED]: '#8b5cf6'
};

export const JobRunsChart: React.FC<JobRunsChartProps> = ({ 
  runs, 
  type = 'timeline',
  dateRange = '7d',
  groupByCodeLocation = false
}) => {
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);
  // Use the runs directly since they're already filtered by the Dashboard
  const filteredRuns = runs;
  
  // Handle empty state
  if (filteredRuns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-color-text-lighter">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No job runs found for the selected time range</p>
          <p className="text-xs mt-1">Try selecting a different date range or check if jobs are running</p>
        </div>
      </div>
    );
  }
  
  if (type === 'status-distribution') {
    if (groupByCodeLocation) {
      // Create separate pie charts for each code location showing job statuses
      const locationStatusData = filteredRuns.reduce((acc, run) => {
        const location = run.repositoryOrigin?.repositoryLocationName || 'Unknown';
        if (!acc[location]) {
          acc[location] = {
            [RunStatus.SUCCESS]: 0,
            [RunStatus.FAILURE]: 0,
            [RunStatus.STARTED]: 0,
            [RunStatus.QUEUED]: 0,
            [RunStatus.CANCELED]: 0,
            [RunStatus.CANCELING]: 0,
            [RunStatus.NOT_STARTED]: 0,
            [RunStatus.STARTING]: 0,
            [RunStatus.MANAGED]: 0
          };
        }
        acc[location][run.status] = (acc[location][run.status] || 0) + 1;
        return acc;
      }, {} as Record<string, Record<RunStatus, number>>);

      const locations = Object.keys(locationStatusData);
      
      if (locations.length === 0) {
        return (
          <div className="flex items-center justify-center h-64 text-color-text-lighter">
            <p>No job runs found for any code locations</p>
          </div>
        );
      }

      return (
        <div className="grid gap-6" style={{ 
          gridTemplateColumns: `repeat(${Math.min(locations.length, 3)}, 1fr)`,
          maxHeight: '400px'
        }}>
          {locations.map((location) => {
            const statusCounts = locationStatusData[location];
            const pieData = Object.entries(statusCounts)
              .filter(([_, count]) => count > 0)
              .map(([status, count]) => ({
                name: status,
                value: count,
                fill: STATUS_COLORS[status as RunStatus]
              }));

            const totalRuns = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);
            
            return (
              <div key={location} className="flex flex-col items-center">
                <h4 
                  className="text-sm font-medium mb-2 text-center"
                  style={{ color: getCodeLocationColor(location) }}
                >
                  {location}
                </h4>
                <p className="text-xs text-color-text-lighter mb-2">
                  {totalRuns} total runs
                </p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
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
            );
          })}
        </div>
      );
    } else {
      // Original status-based pie chart
      const statusCounts = filteredRuns.reduce((acc, run) => {
        acc[run.status] = (acc[run.status] || 0) + 1;
        return acc;
      }, {} as Record<RunStatus, number>);

      const pieData = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        fill: STATUS_COLORS[status as RunStatus]
      }));

      return (
        <div className="flex">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
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
        </div>
      );
    }
  }

  // Timeline chart - group runs by hour or day based on date range
  const days = getDateRangeDays(dateRange);
  const groupByDay = days > 1; // Group by day for ranges longer than 1 day
  
  const timelineData = filteredRuns
    .filter(run => run.startTime)
    .reduce((acc, run) => {
      const date = new Date(parseInt(run.startTime!) * 1000);
      
      let groupDate, key, timeLabel, dateLabel;
      if (groupByDay) {
        // Group by day
        groupDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        key = groupDate.toISOString().split('T')[0];
        timeLabel = groupDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        dateLabel = groupDate.toLocaleDateString();
      } else {
        // Group by hour
        groupDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
        key = groupDate.toISOString();
        timeLabel = groupDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        dateLabel = groupDate.toLocaleDateString();
      }
      
      if (!acc[key]) {
        acc[key] = {
          time: timeLabel,
          date: dateLabel,
          successful: 0,
          failed: 0,
          total: 0
        };
      }
      
      acc[key].total++;
      
      if (groupByCodeLocation) {
        // Get code location for this run
        const codeLocation = run.repositoryOrigin?.repositoryLocationName || 'Unknown';
        
        // Initialize code location counters if not exists
        if (!acc[key][`${codeLocation}_successful`]) {
          acc[key][`${codeLocation}_successful`] = 0;
        }
        if (!acc[key][`${codeLocation}_failed`]) {
          acc[key][`${codeLocation}_failed`] = 0;
        }
        
        // Count by status and code location (excluding running jobs)
        if (run.status === RunStatus.SUCCESS) {
          acc[key][`${codeLocation}_successful`]++;
        } else if (run.status === RunStatus.FAILURE) {
          acc[key][`${codeLocation}_failed`]++;
        }
      } else {
        // Original aggregation without code location grouping (excluding running jobs)
        if (run.status === RunStatus.SUCCESS) {
          acc[key].successful++;
        } else if (run.status === RunStatus.FAILURE) {
          acc[key].failed++;
        }
      }
      
      return acc;
    }, {} as Record<string, any>);

  const chartData = Object.values(timelineData)
    .sort((a: any, b: any) => {
      if (groupByDay) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
      }
    });

  // Get unique code locations for grouping
  const codeLocations = groupByCodeLocation 
    ? Array.from(new Set(filteredRuns.map(run => run.repositoryOrigin?.repositoryLocationName || 'Unknown')))
    : [];

  // Render Lines for code location grouping (similar to SuccessFailureTrendsChart)
  const renderLines = () => {
    if (groupByCodeLocation) {
      const lines: React.ReactElement[] = [];
      codeLocations.forEach((location) => {
        const baseColor = getCodeLocationColor(location);
        const isDashed = location === 'Unknown';
        
        // Success line for this code location
        const successKey = `${location}_successful`;
        const isSuccessHovered = hoveredDataKey === successKey;
        const isSuccessDimmed = hoveredDataKey && hoveredDataKey !== successKey;
        
        lines.push(
          <Line
            key={successKey}
            type="linear"
            dataKey={successKey}
            stroke={baseColor}
            strokeWidth={isSuccessHovered ? 3 : 2}
            strokeOpacity={isSuccessDimmed ? 0.3 : 1}
            strokeDasharray={isDashed ? '5 5' : undefined}
            dot={{ 
              fill: baseColor, 
              stroke: baseColor,
              strokeWidth: 2, 
              r: isSuccessHovered ? 5 : 3,
              fillOpacity: isSuccessDimmed ? 0.3 : 1
            }}
            activeDot={{ r: 6, fill: baseColor, stroke: baseColor }}
            name={`${location} - Successful`}
          />
        );
        
        // Failure line for this code location
        const failureKey = `${location}_failed`;
        const isFailureHovered = hoveredDataKey === failureKey;
        const isFailureDimmed = hoveredDataKey && hoveredDataKey !== failureKey;
        
        lines.push(
          <Line
            key={failureKey}
            type="linear"
            dataKey={failureKey}
            stroke={baseColor}
            strokeWidth={isFailureHovered ? 3 : 2}
            strokeOpacity={isFailureDimmed ? 0.3 : 1}
            strokeDasharray={isDashed ? '8 4' : '4 4'} // Dashed for failures
            dot={{ 
              fill: baseColor, 
              stroke: '#dc2626', // Red outline for failures
              strokeWidth: 2, 
              r: isFailureHovered ? 5 : 3,
              fillOpacity: isFailureDimmed ? 0.3 : 1
            }}
            activeDot={{ r: 6, fill: baseColor, stroke: '#dc2626', strokeWidth: 2 }}
            name={`${location} - Failed`}
          />
        );

      });
      return lines;
    } else {
      // Original single lines for overall status with hover effects
      const isSuccessHovered = hoveredDataKey === 'successful';
      const isSuccessDimmed = hoveredDataKey && hoveredDataKey !== 'successful';
      const isFailedHovered = hoveredDataKey === 'failed';
      const isFailedDimmed = hoveredDataKey && hoveredDataKey !== 'failed';
      
      return [
        <Line
          key="successful"
          type="linear"
          dataKey="successful"
          stroke="var(--color-accent-success)"
          strokeWidth={isSuccessHovered ? 3 : 2}
          strokeOpacity={isSuccessDimmed ? 0.3 : 1}
          dot={{ 
            fill: 'var(--color-accent-success)', 
            stroke: 'var(--color-accent-success)',
            strokeWidth: 2, 
            r: isSuccessHovered ? 5 : 3,
            fillOpacity: isSuccessDimmed ? 0.3 : 1
          }}
          activeDot={{ r: 6, fill: 'var(--color-accent-success)', stroke: 'var(--color-accent-success)' }}
          name="Successful"
        />,
        <Line
          key="failed"
          type="linear"
          dataKey="failed"
          stroke="var(--color-accent-success)"
          strokeWidth={isFailedHovered ? 3 : 2}
          strokeOpacity={isFailedDimmed ? 0.3 : 1}
          strokeDasharray="4 4"
          dot={{ 
            fill: 'var(--color-accent-success)', 
            stroke: '#dc2626', // Red outline for failures
            strokeWidth: 2, 
            r: isFailedHovered ? 5 : 3,
            fillOpacity: isFailedDimmed ? 0.3 : 1
          }}
          activeDot={{ r: 6, fill: 'var(--color-accent-success)', stroke: '#dc2626', strokeWidth: 2 }}
          name="Failed"
        />
      ];
    }
  };

  return (
    <div className="flex gap-4">
      {/* Chart Area */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <YAxis 
              tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--color-background-lighter)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                color: 'var(--color-text-default)'
              }}
              labelFormatter={(label) => `Time: ${label}`}
            />
            {renderLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend Box */}
      <div className="w-48 bg-color-background-lighter border border-color-border rounded-lg p-3">
        <div className="space-y-2">
          {(() => {
            if (groupByCodeLocation) {
              // For grouped view, only show code location specific entries
              const legendItems: React.ReactElement[] = [];
              codeLocations.forEach((location) => {
                const baseColor = getCodeLocationColor(location);
                
                // Add success entry
                legendItems.push(
                  <div 
                    key={`${location}_successful`}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                    onMouseEnter={() => setHoveredDataKey(`${location}_successful`)}
                    onMouseLeave={() => setHoveredDataKey(null)}
                  >
                    <div className="relative">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: baseColor }}
                      />
                    </div>
                    <span className="text-color-text-default text-xs leading-tight">{location} Successes</span>
                  </div>
                );
                
                // Add failure entry
                legendItems.push(
                  <div 
                    key={`${location}_failed`}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                    onMouseEnter={() => setHoveredDataKey(`${location}_failed`)}
                    onMouseLeave={() => setHoveredDataKey(null)}
                  >
                    <div className="relative">
                      <div 
                        className="w-3 h-3 rounded-full border-2 border-dashed" 
                        style={{ 
                          backgroundColor: baseColor,
                          borderColor: '#dc2626' 
                        }}
                      />
                    </div>
                    <span className="text-color-text-default text-xs leading-tight">{location} Failures</span>
                  </div>
                );
                

              });
              return legendItems;
            } else {
              // For overall view, show status-based legend
              return [
                <div 
                  key="successful"
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                  onMouseEnter={() => setHoveredDataKey('successful')}
                  onMouseLeave={() => setHoveredDataKey(null)}
                >
                  <div className="relative">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: 'var(--color-accent-success)' }}
                    />
                  </div>
                  <span className="text-color-text-default text-xs leading-tight">Successful</span>
                </div>,
                
                <div 
                  key="failed"
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                  onMouseEnter={() => setHoveredDataKey('failed')}
                  onMouseLeave={() => setHoveredDataKey(null)}
                >
                  <div className="relative">
                    <div 
                      className="w-3 h-3 rounded-full border-2 border-dashed" 
                      style={{ 
                        backgroundColor: 'var(--color-accent-success)',
                        borderColor: '#dc2626' 
                      }}
                    />
                  </div>
                  <span className="text-color-text-default text-xs leading-tight">Failed</span>
                </div>
              ];
            }
          })()}
        </div>
      </div>
    </div>
  );
};