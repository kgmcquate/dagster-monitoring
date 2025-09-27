import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { JobRun, RunStatus } from '../types/dagster';
import { getDateRangeDays, isWithinDateRange } from '../utils/dateUtils';

interface JobRunsChartProps {
  runs: JobRun[];
  type?: 'timeline' | 'status-distribution';
  title?: string;
  dateRange?: string;
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
  title = 'Job Runs',
  dateRange = '7d'
}) => {
  // Use the runs directly since they're already filtered by the Dashboard
  const filteredRuns = runs;
  
  // Handle empty state
  if (filteredRuns.length === 0) {
    return (
      <div className="bg-color-background-default border border-color-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-color-text-default mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-color-text-lighter">
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-sm">No job runs found for the selected time range</p>
            <p className="text-xs mt-1">Try selecting a different date range or check if jobs are running</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (type === 'status-distribution') {
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
    .sort((a: any, b: any) => {
      if (groupByDay) {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime();
      }
    });

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