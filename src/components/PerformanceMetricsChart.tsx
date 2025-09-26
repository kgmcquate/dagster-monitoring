import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Asset } from '../types/dagster';

interface PerformanceMetricsChartProps {
  assets: Asset[];
}

interface PerformanceDataPoint {
  assetName: string;
  avgDuration: number;
  successRate: number;
  totalRuns: number;
  group: string;
}

export default function PerformanceMetricsChart({ assets }: PerformanceMetricsChartProps) {
  const generatePerformanceData = (): PerformanceDataPoint[] => {
    return assets.map(asset => {
      const materializations = asset.assetMaterializations || [];
      
      if (materializations.length === 0) {
        return {
          assetName: asset.key.path.join('.').substring(0, 20) + '...',
          avgDuration: 0,
          successRate: 0,
          totalRuns: 0,
          group: asset.definition?.groupName || 'Unknown'
        };
      }

      // Calculate average duration
      let totalDuration = 0;
      let durationsCount = 0;
      let successes = 0;

      materializations.forEach(mat => {
        if (mat.stepStats?.startTime && mat.stepStats?.endTime) {
          const duration = parseFloat(mat.stepStats.endTime) - parseFloat(mat.stepStats.startTime);
          totalDuration += duration;
          durationsCount++;
        }
        
        if (mat.stepStats?.status === 'SUCCESS') {
          successes++;
        }
      });

      const avgDuration = durationsCount > 0 ? totalDuration / durationsCount / 1000 : 0; // Convert to seconds
      const successRate = materializations.length > 0 ? (successes / materializations.length) * 100 : 0;

      return {
        assetName: asset.key.path.join('.').length > 25 
          ? asset.key.path.join('.').substring(0, 25) + '...' 
          : asset.key.path.join('.'),
        avgDuration: Math.round(avgDuration),
        successRate: Math.round(successRate),
        totalRuns: materializations.length,
        group: asset.definition?.groupName || 'Unknown'
      };
    }).filter(data => data.totalRuns > 0);
  };

  const performanceData = generatePerformanceData();
  
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

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart data={performanceData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis 
            type="number"
            dataKey="avgDuration" 
            name="Avg Duration (s)"
            stroke="var(--color-text-light)"
            fontSize={12}
          />
          <YAxis 
            type="number"
            dataKey="successRate" 
            name="Success Rate (%)"
            stroke="var(--color-text-light)"
            fontSize={12}
            domain={[0, 100]}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3' }}
            contentStyle={{
              backgroundColor: 'var(--color-background-lighter)',
              border: '1px solid var(--color-border-default)',
              borderRadius: '6px',
              color: 'var(--color-text-default)'
            }}
            formatter={(value, name) => [
              name === 'avgDuration' ? `${value}s` : 
              name === 'successRate' ? `${value}%` : value,
              name === 'avgDuration' ? 'Avg Duration' : 
              name === 'successRate' ? 'Success Rate' : name
            ]}
            labelFormatter={(label) => `Asset: ${label}`}
          />
          <Scatter dataKey="successRate" fill="var(--color-accent-blue)">
            {performanceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getGroupColor(entry.group)} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}