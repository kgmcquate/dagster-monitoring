import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Asset } from '../types/dagster';

interface SuccessFailureTrendsChartProps {
  assets: Asset[];
}

interface TrendDataPoint {
  date: string;
  successes: number;
  failures: number;
  total: number;
}

export default function SuccessFailureTrendsChart({ assets }: SuccessFailureTrendsChartProps) {
  // Generate trend data for the last 7 days
  const generateTrendData = (): TrendDataPoint[] => {
    const days = 7;
    const trendData: TrendDataPoint[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let successes = 0;
      let failures = 0;
      let total = 0;
      
      assets.forEach(asset => {
        asset.assetMaterializations?.forEach(mat => {
          const matDate = new Date(parseFloat(mat.timestamp)).toISOString().split('T')[0];
          if (matDate === dateStr) {
            total++;
            if (mat.stepStats?.status === 'SUCCESS') {
              successes++;
            } else if (mat.stepStats?.status === 'FAILURE') {
              failures++;
            }
          }
        });
      });
      
      trendData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        successes,
        failures,
        total
      });
    }
    
    return trendData;
  };

  const trendData = generateTrendData();

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis 
            dataKey="date" 
            stroke="var(--color-text-light)"
            fontSize={12}
          />
          <YAxis 
            stroke="var(--color-text-light)"
            fontSize={12}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'var(--color-background-lighter)',
              border: '1px solid var(--color-border-default)',
              borderRadius: '6px',
              color: 'var(--color-text-default)'
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="successes" 
            stroke="var(--color-accent-green)" 
            strokeWidth={2}
            name="Successes"
            dot={{ fill: 'var(--color-accent-green)', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="failures" 
            stroke="var(--color-accent-red)" 
            strokeWidth={2}
            name="Failures"
            dot={{ fill: 'var(--color-accent-red)', strokeWidth: 2, r: 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="var(--color-accent-blue)" 
            strokeWidth={2}
            name="Total"
            dot={{ fill: 'var(--color-accent-blue)', strokeWidth: 2, r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}