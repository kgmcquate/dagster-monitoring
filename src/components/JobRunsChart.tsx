import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { JobRun, RunStatus } from '../types/dagster';

interface JobRunsChartProps {
  runs: JobRun[];
  type?: 'timeline' | 'status-distribution';
  title?: string;
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
  title = 'Job Runs'
}) => {
  if (type === 'status-distribution') {
    const statusCounts = runs.reduce((acc, run) => {
      acc[run.status] = (acc[run.status] || 0) + 1;
      return acc;
    }, {} as Record<RunStatus, number>);

    const pieData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
      fill: STATUS_COLORS[status as RunStatus]
    }));

    return (
      <div className="bg-color-background-default border border-color-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-color-text-default mb-4">{title}</h3>
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
    );
  }

  // Timeline chart - group runs by hour
  const timelineData = runs
    .filter(run => run.startTime)
    .reduce((acc, run) => {
      const date = new Date(parseInt(run.startTime!) * 1000);
      const hour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
      const key = hour.toISOString();
      
      if (!acc[key]) {
        acc[key] = {
          time: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          date: hour.toLocaleDateString(),
          successful: 0,
          failed: 0,
          running: 0,
          total: 0
        };
      }
      
      acc[key].total++;
      if (run.status === RunStatus.SUCCESS) {
        acc[key].successful++;
      } else if (run.status === RunStatus.FAILURE) {
        acc[key].failed++;
      } else if ([RunStatus.STARTED, RunStatus.STARTING].includes(run.status)) {
        acc[key].running++;
      }
      
      return acc;
    }, {} as Record<string, any>);

  const chartData = Object.values(timelineData)
    .sort((a: any, b: any) => new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime())
    .slice(-24); // Last 24 hours

  return (
    <div className="bg-color-background-default border border-color-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-color-text-default mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
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
              backgroundColor: 'var(--color-background-default)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              color: 'var(--color-text-default)'
            }}
            labelFormatter={(label) => `Time: ${label}`}
          />
          <Bar 
            dataKey="successful" 
            stackId="runs" 
            fill={STATUS_COLORS[RunStatus.SUCCESS]}
            name="Successful"
          />
          <Bar 
            dataKey="failed" 
            stackId="runs" 
            fill={STATUS_COLORS[RunStatus.FAILURE]}
            name="Failed"
          />
          <Bar 
            dataKey="running" 
            stackId="runs" 
            fill={STATUS_COLORS[RunStatus.STARTED]}
            name="Running"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};