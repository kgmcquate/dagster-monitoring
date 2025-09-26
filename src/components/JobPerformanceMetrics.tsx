import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { JobRun, RunStatus } from '../types/dagster';

interface JobPerformanceMetricsProps {
  runs: JobRun[];
  type?: 'duration-trend' | 'success-rate' | 'duration-scatter';
  title?: string;
}

export const JobPerformanceMetrics: React.FC<JobPerformanceMetricsProps> = ({ 
  runs, 
  type = 'duration-trend',
  title = 'Job Performance'
}) => {
  const completedRuns = runs.filter(run => 
    run.startTime && run.endTime && [RunStatus.SUCCESS, RunStatus.FAILURE].includes(run.status)
  );

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

  // Default: duration trend
  const trendData = completedRuns
    .map(run => {
      const duration = (parseInt(run.endTime!) - parseInt(run.startTime!)) / 60; // minutes
      const startTime = new Date(parseInt(run.startTime!) * 1000);
      
      return {
        time: startTime.toISOString(),
        duration,
        status: run.status,
        jobName: run.pipelineName
      };
    })
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
    .slice(-50); // Last 50 runs

  return (
    <div className="bg-color-background-default border border-color-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-color-text-default mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis 
            dataKey="time" 
            tick={{ fill: 'var(--color-text-lighter)', fontSize: 12 }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickFormatter={(value) => new Date(value).toLocaleTimeString()}
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
            formatter={(value: number) => [`${value.toFixed(1)} min`, 'Duration']}
            labelFormatter={(label) => `Time: ${new Date(label).toLocaleTimeString()}`}
          />
          <Line 
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