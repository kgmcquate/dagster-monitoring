import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AssetHealthChartProps {
  healthy: number;
  stale: number;
  missing: number;
}

const COLORS = {
  healthy: '#10b981',
  stale: '#f59e0b',
  missing: '#ef4444',
};

export default function AssetHealthChart({ healthy, stale, missing }: AssetHealthChartProps) {
  const data = [
    { name: 'Healthy', value: healthy, color: COLORS.healthy },
    { name: 'Stale', value: stale, color: COLORS.stale },
    { name: 'Missing', value: missing, color: COLORS.missing },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        No asset data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}