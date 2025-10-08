import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { JobRun, RunStatus } from '../../types/dagster';
import { getDateRangeDays, isWithinDateRange } from '../../utils/dateUtils';
import { getCodeLocationColor } from '../../utils/codeLocationColors';

interface JobPerformanceMetricsProps {
  runs: JobRun[];
  type?: 'duration-trend' | 'success-rate' | 'duration-scatter';
  dateRange?: string;
  groupByCodeLocation?: boolean;
}

export const JobPerformanceMetrics: React.FC<JobPerformanceMetricsProps> = ({ 
  runs, 
  type = 'duration-trend',
  dateRange = '7d',
  groupByCodeLocation = false
}) => {
  // Use the runs directly since they're already filtered by the Dashboard
  const completedRuns = runs.filter(run => 
    run.startTime && run.endTime && [RunStatus.SUCCESS, RunStatus.FAILURE].includes(run.status)
  );

  // Handle empty state
  if (runs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-color-text-lighter">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <p className="text-sm">No job runs found for the selected time range</p>
          <p className="text-xs mt-1">Try selecting a different date range or check if jobs are running</p>
        </div>
      </div>
    );
  }

  if (type === 'success-rate') {
    const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

    // Get unique code locations
    const codeLocations = Array.from(new Set(
      completedRuns.map(run => run.repositoryOrigin?.repositoryLocationName || 'Unknown')
    ));

    // Calculate success rate over time (daily)
    const dailyStats = completedRuns.reduce((acc, run) => {
      const date = new Date(parseInt(run.startTime!) * 1000);
      const dayKey = date.toISOString().split('T')[0];
      const location = run.repositoryOrigin?.repositoryLocationName || 'Unknown';
      
      if (!acc[dayKey]) {
        acc[dayKey] = { 
          date: dayKey, 
          dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          successful: 0, 
          total: 0, 
          successRate: 0 
        };
        
        if (groupByCodeLocation) {
          codeLocations.forEach(loc => {
            acc[dayKey][`${loc}_successful`] = 0;
            acc[dayKey][`${loc}_total`] = 0;
            acc[dayKey][`${loc}_successRate`] = 0;
          });
        }
      }
      
      acc[dayKey].total++;
      if (run.status === RunStatus.SUCCESS) {
        acc[dayKey].successful++;
      }
      acc[dayKey].successRate = (acc[dayKey].successful / acc[dayKey].total) * 100;
      
      if (groupByCodeLocation) {
        acc[dayKey][`${location}_total`]++;
        if (run.status === RunStatus.SUCCESS) {
          acc[dayKey][`${location}_successful`]++;
        }
        const locTotal = acc[dayKey][`${location}_total`];
        const locSuccessful = acc[dayKey][`${location}_successful`];
        acc[dayKey][`${location}_successRate`] = locTotal > 0 ? (locSuccessful / locTotal) * 100 : 0;
      }
      
      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(dailyStats)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 2 weeks

    const renderLines = () => {
      const lines: React.ReactElement[] = [];

      if (groupByCodeLocation) {
        codeLocations.forEach((location) => {
          const dataKey = `${location}_successRate`;
          const isHovered = hoveredDataKey === dataKey;
          const isDimmed = hoveredDataKey && !isHovered;

          lines.push(
            <Line
              key={dataKey}
              type="linear"
              dataKey={dataKey}
              stroke={getCodeLocationColor(location)}
              strokeWidth={isHovered ? 4 : 2}
              strokeOpacity={isDimmed ? 0.3 : 1}
              name={`${location} Success Rate`}
              dot={{ 
                fill: getCodeLocationColor(location), 
                strokeWidth: 2, 
                r: isHovered ? 5 : 3,
                fillOpacity: isDimmed ? 0.3 : 1
              }}
              strokeDasharray={location === 'Unknown' ? '5 5' : undefined}
            />
          );
        });
      } else {
        const isHovered = hoveredDataKey === 'successRate';
        const isDimmed = hoveredDataKey && !isHovered;

        lines.push(
          <Line
            key="successRate"
            type="linear"
            dataKey="successRate"
            stroke="#10b981"
            strokeWidth={isHovered ? 4 : 2}
            strokeOpacity={isDimmed ? 0.3 : 1}
            name="Success Rate"
            dot={{ 
              fill: '#10b981', 
              strokeWidth: 2, 
              r: isHovered ? 5 : 3,
              fillOpacity: isDimmed ? 0.3 : 1
            }}
          />
        );
      }

      return lines;
    };

    return (
      <div className="flex">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  dataKey="dateLabel" 
                  tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-background-default)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text-default)'
                  }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                {renderLines()}
              </LineChart>
            </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        {groupByCodeLocation && (
          <div className="ml-6 flex flex-col justify-center space-y-2">
            <div className="text-xs font-medium text-color-text-light mb-2">Code Locations</div>
            {codeLocations.map(location => {
              const dataKey = `${location}_successRate`;
              return (
                <div 
                  key={location} 
                  className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                  onMouseEnter={() => setHoveredDataKey(dataKey)}
                  onMouseLeave={() => setHoveredDataKey(null)}
                >
                  <div 
                    className="w-3 h-3 rounded-sm" 
                    style={{ backgroundColor: getCodeLocationColor(location) }}
                  />
                  <span className="text-color-text-default text-xs leading-tight">{location}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (type === 'duration-scatter') {
    const scatterData = completedRuns.map(run => {
      const duration = (parseInt(run.endTime!) - parseInt(run.startTime!)) / 60; // minutes
      const startTime = new Date(parseInt(run.startTime!) * 1000);
      
      return {
        x: startTime.getTime(),
        y: duration,
        status: run.status,
        jobName: run.pipelineName,
        runId: run.runId
      };
    });

    return (
      <div className="flex">
        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis 
                  type="number"
                  dataKey="x"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis 
                  type="number"
                  dataKey="y"
                  tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--color-border)' }}
                  label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'var(--color-background-default)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text-default)'
                  }}
                  formatter={(value: number) => [
                    `${value.toFixed(1)} min`,
                    'Duration'
                  ]}
                  labelFormatter={(_, payload) => {
                    if (payload && payload[0]) {
                      const data = payload[0].payload;
                      return `Job: ${data.jobName} | Status: ${data.status}`;
                    }
                    return '';
                  }}
                />
                <Scatter 
                  dataKey="y" 
                  fill="#3b82f6"
                />
              </ScatterChart>
            </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // Default: duration trend - aggregate by time periods
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);
  const days = getDateRangeDays(dateRange);
  const groupByHour = days === 1;

  // Get unique code locations
  const codeLocations = Array.from(new Set(
    completedRuns.map(run => run.repositoryOrigin?.repositoryLocationName || 'Unknown')
  ));
  
  const generateDurationTrendData = () => {
    const trendData: any[] = [];
    
    if (groupByHour) {
      // Generate hourly aggregations for 1-day range
      for (let i = 23; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i, 0, 0, 0);
        const targetHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
        
        const hourlyRuns = completedRuns.filter(run => {
          const startTime = new Date(parseInt(run.startTime!) * 1000);
          const runHour = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate(), startTime.getHours());
          return runHour.getTime() === targetHour.getTime();
        });
        
        const dataPoint: any = {
          time: date.toISOString(),
          timeLabel: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          duration: 0,
          runCount: hourlyRuns.length
        };

        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            dataPoint[`${location}_duration`] = 0;
            dataPoint[`${location}_runCount`] = 0;
          });
        }
        
        if (hourlyRuns.length > 0) {
          const avgDuration = hourlyRuns.reduce((sum, run) => 
            sum + ((parseInt(run.endTime!) - parseInt(run.startTime!)) / 60), 0) / hourlyRuns.length;
          dataPoint.duration = avgDuration;

          if (groupByCodeLocation) {
            codeLocations.forEach(location => {
              const locationRuns = hourlyRuns.filter(run => 
                (run.repositoryOrigin?.repositoryLocationName || 'Unknown') === location
              );
              if (locationRuns.length > 0) {
                const locationAvgDuration = locationRuns.reduce((sum, run) => 
                  sum + ((parseInt(run.endTime!) - parseInt(run.startTime!)) / 60), 0) / locationRuns.length;
                dataPoint[`${location}_duration`] = locationAvgDuration;
                dataPoint[`${location}_runCount`] = locationRuns.length;
              }
            });
          }
        }
        
        trendData.push(dataPoint);
      }
    } else {
      // Generate daily aggregations for longer ranges
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dailyRuns = completedRuns.filter(run => {
          const startTime = new Date(parseInt(run.startTime!) * 1000);
          return startTime.toISOString().split('T')[0] === dateStr;
        });
        
        const dataPoint: any = {
          time: date.toISOString(),
          timeLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          duration: 0,
          runCount: dailyRuns.length
        };

        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            dataPoint[`${location}_duration`] = 0;
            dataPoint[`${location}_runCount`] = 0;
          });
        }
        
        if (dailyRuns.length > 0) {
          const avgDuration = dailyRuns.reduce((sum, run) => 
            sum + ((parseInt(run.endTime!) - parseInt(run.startTime!)) / 60), 0) / dailyRuns.length;
          dataPoint.duration = avgDuration;

          if (groupByCodeLocation) {
            codeLocations.forEach(location => {
              const locationRuns = dailyRuns.filter(run => 
                (run.repositoryOrigin?.repositoryLocationName || 'Unknown') === location
              );
              if (locationRuns.length > 0) {
                const locationAvgDuration = locationRuns.reduce((sum, run) => 
                  sum + ((parseInt(run.endTime!) - parseInt(run.startTime!)) / 60), 0) / locationRuns.length;
                dataPoint[`${location}_duration`] = locationAvgDuration;
                dataPoint[`${location}_runCount`] = locationRuns.length;
              }
            });
          }
        }
        
        trendData.push(dataPoint);
      }
    }
    
    return trendData;
  };
  
  const trendData = generateDurationTrendData();

  const renderLines = () => {
    const lines: React.ReactElement[] = [];

    if (groupByCodeLocation) {
      codeLocations.forEach((location) => {
        const dataKey = `${location}_duration`;
        const isHovered = hoveredDataKey === dataKey;
        const isDimmed = hoveredDataKey && !isHovered;

        lines.push(
          <Line
            key={dataKey}
            type="linear"
            dataKey={dataKey}
            stroke={getCodeLocationColor(location)}
            strokeWidth={isHovered ? 4 : 2}
            strokeOpacity={isDimmed ? 0.3 : 1}
            name={`${location} Avg Duration`}
            dot={{ 
              fill: getCodeLocationColor(location), 
              strokeWidth: 2, 
              r: isHovered ? 5 : 3,
              fillOpacity: isDimmed ? 0.3 : 1
            }}
            strokeDasharray={location === 'Unknown' ? '5 5' : undefined}
          />
        );
      });
    } else {
      const isHovered = hoveredDataKey === 'duration';
      const isDimmed = hoveredDataKey && !isHovered;

      lines.push(
        <Line
          key="duration"
          type="linear"
          dataKey="duration"
          stroke="#3b82f6"
          strokeWidth={isHovered ? 4 : 2}
          strokeOpacity={isDimmed ? 0.3 : 1}
          name="Avg Duration"
          dot={{ 
            fill: '#3b82f6', 
            strokeWidth: 2, 
            r: isHovered ? 5 : 3,
            fillOpacity: isDimmed ? 0.3 : 1
          }}
        />
      );
    }

    return lines;
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis 
                dataKey="timeLabel" 
                tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis 
                tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
                axisLine={{ stroke: 'var(--color-border)' }}
                label={{ value: 'Duration (min)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'var(--color-background-default)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '4px',
                  color: 'var(--color-text-default)'
                }}
                formatter={(value: number, name: string) => [`${value.toFixed(1)} min`, name]}
                labelFormatter={(label) => `${groupByHour ? 'Hour' : 'Date'}: ${label}`}
              />
              {renderLines()}
            </LineChart>
          </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      {groupByCodeLocation && (
        <div className="ml-6 flex flex-col justify-center space-y-2">
          <div className="text-xs font-medium text-color-text-light mb-2">Code Locations</div>
          {codeLocations.map(location => {
            const dataKey = `${location}_duration`;
            return (
              <div 
                key={location} 
                className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                onMouseEnter={() => setHoveredDataKey(dataKey)}
                onMouseLeave={() => setHoveredDataKey(null)}
              >
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: getCodeLocationColor(location) }}
                />
                <span className="text-color-text-default text-xs leading-tight">{location}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};