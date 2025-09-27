import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { JobRun, RunStatus } from '../types/dagster';
import { getDateRangeDays, isWithinDateRange } from '../utils/dateUtils';

interface JobPerformanceMetricsProps {
  runs: JobRun[];
  type?: 'duration-trend' | 'success-rate' | 'duration-scatter';
  title?: string;
  dateRange?: string;
}

export const JobPerformanceMetrics: React.FC<JobPerformanceMetricsProps> = ({ 
  runs, 
  type = 'duration-trend',
  title = 'Job Performance',
  dateRange = '7d'
}) => {
  // Use the runs directly since they're already filtered by the Dashboard
  const completedRuns = runs.filter(run => 
    run.startTime && run.endTime && [RunStatus.SUCCESS, RunStatus.FAILURE].includes(run.status)
  );

  // Handle empty state
  if (runs.length === 0) {
    return (
      <div className="bg-color-background-default border border-color-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-color-text-default mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-color-text-lighter">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p className="text-sm">No job runs found for the selected time range</p>
            <p className="text-xs mt-1">Try selecting a different date range or check if jobs are running</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'success-rate') {
    // Calculate success rate over time (daily)
    const dailyStats = completedRuns.reduce((acc, run) => {
      const date = new Date(parseInt(run.startTime!) * 1000);
      const dayKey = date.toISOString().split('T')[0];
      
      if (!acc[dayKey]) {
        acc[dayKey] = { date: dayKey, successful: 0, total: 0, successRate: 0 };
      }
      
      acc[dayKey].total++;
      if (run.status === RunStatus.SUCCESS) {
        acc[dayKey].successful++;
      }
      acc[dayKey].successRate = (acc[dayKey].successful / acc[dayKey].total) * 100;
      
      return acc;
    }, {} as Record<string, any>);

    const chartData = Object.values(dailyStats)
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Last 2 weeks

    return (
      <div className="bg-color-background-default border border-color-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-color-text-default mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="date" 
              tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
              axisLine={{ stroke: 'var(--color-border)' }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
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
              formatter={(value: number) => [`${value.toFixed(1)}%`, 'Success Rate']}
              labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
            />
            <Line 
              key="successRate"
              type="monotone" 
              dataKey="successRate" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
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
      <div className="bg-color-background-default border border-color-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-color-text-default mb-4">{title}</h3>
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
    );
  }

  // Default: duration trend - aggregate by time periods
  const days = getDateRangeDays(dateRange);
  const groupByHour = days === 1;
  
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
        
        if (hourlyRuns.length > 0) {
          const avgDuration = hourlyRuns.reduce((sum, run) => 
            sum + ((parseInt(run.endTime!) - parseInt(run.startTime!)) / 60), 0) / hourlyRuns.length;
          
          trendData.push({
            time: date.toISOString(),
            duration: avgDuration,
            runCount: hourlyRuns.length,
            timeLabel: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          });
        }
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
        
        if (dailyRuns.length > 0) {
          const avgDuration = dailyRuns.reduce((sum, run) => 
            sum + ((parseInt(run.endTime!) - parseInt(run.startTime!)) / 60), 0) / dailyRuns.length;
          
          trendData.push({
            time: date.toISOString(),
            duration: avgDuration,
            runCount: dailyRuns.length,
            timeLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          });
        }
      }
    }
    
    return trendData;
  };
  
  const trendData = generateDurationTrendData();

  return (
    <div className="bg-color-background-default border border-color-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-color-text-default mb-4">{title}</h3>
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
            formatter={(value: number) => [`${value.toFixed(1)} min`, 'Avg Duration']}
            labelFormatter={(label) => `${groupByHour ? 'Hour' : 'Date'}: ${label}`}
          />
          <Line 
            key="duration"
            type="monotone" 
            dataKey="duration" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={(props: any) => (
              <circle 
                cx={props.cx} 
                cy={props.cy} 
                r={3} 
                fill={props.payload.status === RunStatus.SUCCESS ? '#10b981' : '#ef4444'}
                stroke={props.payload.status === RunStatus.SUCCESS ? '#10b981' : '#ef4444'}
                strokeWidth={2}
              />
            )}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};