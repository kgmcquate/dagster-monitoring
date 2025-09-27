import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Asset } from '../types/dagster';
import { getDateRangeDays, isWithinDateRange } from '../utils/dateUtils';

interface PerformanceMetricsChartProps {
  assets: Asset[];
  groupByCodeLocation?: boolean;
  dateRange?: string;
}

interface PerformanceDataPoint {
  assetName: string;
  avgDuration: number;
  successRate: number;
  totalRuns: number;
  group: string;
}

export default function PerformanceMetricsChart({ assets, groupByCodeLocation = false, dateRange = '7d' }: PerformanceMetricsChartProps) {
  const generatePerformanceData = (): PerformanceDataPoint[] => {
    const dataPoints = assets.map(asset => {
      const materializations = (asset.assetMaterializations || []).filter(mat => 
        isWithinDateRange(mat.timestamp, dateRange)
      );
      
      if (materializations.length === 0) {
        return null; // Filter out assets with no materializations
      }

      // Calculate average duration and success rate
      let totalDuration = 0;
      let durationsCount = 0;
      let successes = 0;
      let statusCount = 0;

      materializations.forEach(mat => {
        // Check for timing data
        if (mat.stepStats?.startTime && mat.stepStats?.endTime) {
          const startTime = parseFloat(mat.stepStats.startTime);
          const endTime = parseFloat(mat.stepStats.endTime);
          if (!isNaN(startTime) && !isNaN(endTime) && endTime > startTime) {
            const duration = endTime - startTime;
            totalDuration += duration;
            durationsCount++;
          }
        }
        
        // Check for status
        if (mat.stepStats?.status) {
          statusCount++;
          if (mat.stepStats.status === 'SUCCESS') {
            successes++;
          }
        }
      });

      // Only include assets that have some performance data
      if (durationsCount === 0 && statusCount === 0) {
        return null;
      }

      const avgDuration = durationsCount > 0 ? Math.round(totalDuration / durationsCount / 1000) : 0; // Convert to seconds
      const successRate = statusCount > 0 ? Math.round((successes / statusCount) * 100) : 0;

      return {
        assetName: asset.key.path.join('.').length > 25 
          ? asset.key.path.join('.').substring(0, 25) + '...' 
          : asset.key.path.join('.'),
        avgDuration,
        successRate,
        totalRuns: materializations.length,
        group: asset.definition?.repository?.location?.name || 'Unknown'
      };
    }).filter(data => data !== null) as PerformanceDataPoint[];

    return dataPoints;
  };

  const performanceData = generatePerformanceData();
  
  // Show message if no performance data is available
  if (performanceData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="text-center text-color-text-lighter">
          <p className="text-lg mb-2">No Performance Data Available</p>
          <p className="text-sm">
            Performance metrics require assets with timing data from materializations.
          </p>
        </div>
      </div>
    );
  }
  
  // Color mapping for different groups
  const getGroupColor = (group: string) => {
    const colors = [
      'var(--color-accent-blue)',
      'var(--color-accent-green)', 
      'var(--color-accent-yellow)',
      'var(--color-accent-red)',
      'var(--color-text-light)'
    ];
    const hash = group.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  // Get unique code locations for legend when grouping
  const locations = groupByCodeLocation 
    ? [...new Set(performanceData.map(item => item.group))] 
    : [];

  return (
    <div className="h-80 flex gap-4">
      {/* Chart Area */}
      <div className="flex-1">
        <div className="mb-2 text-sm text-color-text-lighter">
          {performanceData.length} assets with performance data
          {groupByCodeLocation && ` across ${locations.length} code locations`}
        </div>
        <ResponsiveContainer width="100%" height="90%">
          <ScatterChart data={performanceData} margin={{ top: 20, right: 10, bottom: 40, left: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
            <XAxis 
              type="number"
              dataKey="avgDuration" 
              name="Avg Duration (s)"
              stroke="var(--color-text-light)"
              fontSize={12}
              label={{ value: 'Average Duration (seconds)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle', fill: 'var(--color-text-lighter)' } }}
            />
            <YAxis 
              type="number"
              dataKey="successRate" 
              name="Success Rate (%)"
              stroke="var(--color-text-light)"
              fontSize={12}
              domain={[0, 100]}
              label={{ value: 'Success Rate (%)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'var(--color-text-lighter)' } }}
            />
            <Tooltip 
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: 'var(--color-background-lighter)',
                border: '1px solid var(--color-border-default)',
                borderRadius: '6px',
                color: 'var(--color-text-default)'
              }}
              formatter={(value, name) => {
                if (name === 'successRate') {
                  return [`${value}%`, 'Success Rate'];
                }
                return [value, name];
              }}
              labelFormatter={(value, payload) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return `${data.assetName} (${data.group}) - ${data.totalRuns} runs, ${data.avgDuration}s avg`;
                }
                return value;
              }}
            />
            <Scatter dataKey="successRate" fill="var(--color-accent-blue)">
              {performanceData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={groupByCodeLocation ? getGroupColor(entry.group) : 'var(--color-accent-blue)'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend Box */}
      {groupByCodeLocation && locations.length > 0 && (
        <div className="w-48 bg-color-background-lighter border border-color-border rounded-lg p-3">
          <h4 className="text-sm font-medium mb-3 text-color-text-default">Code Locations</h4>
          <div className="space-y-2">
            {locations.map(location => (
              <div key={location} className="flex items-center gap-2 text-sm">
                <div className="relative">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: getGroupColor(location) }}
                  />
                </div>
                <span className="text-color-text-default text-xs leading-tight">{location}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}