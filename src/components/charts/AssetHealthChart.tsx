import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Asset, AssetHealthStatus } from '../../types/dagster';

interface AssetHealthChartProps {
  healthy?: number;
  stale?: number;
  missing?: number;
  assets?: Asset[];
  groupByCodeLocation?: boolean;
  getAssetStatus?: (asset: Asset) => AssetHealthStatus;
}

const COLORS = {
  healthy: '#10b981',
  stale: '#f59e0b',
  missing: '#ef4444',
};

export default function AssetHealthChart({ 
  healthy = 0, 
  stale = 0, 
  missing = 0, 
  assets = [], 
  groupByCodeLocation = false,
  getAssetStatus 
}: AssetHealthChartProps) {
  
  if (groupByCodeLocation && assets.length > 0 && getAssetStatus) {
    // Group assets by code location and calculate health stats for each
    const locationStats = assets.reduce((acc, asset) => {
      const location = asset.definition?.repository?.location?.name || 'Unknown';
      if (!acc[location]) {
        acc[location] = { healthy: 0, stale: 0, missing: 0 };
      }
      
      const status = getAssetStatus(asset);
      if (status === AssetHealthStatus.FRESH) {
        acc[location].healthy++;
      } else if (status === AssetHealthStatus.STALE) {
        acc[location].stale++;
      } else {
        acc[location].missing++;
      }
      
      return acc;
    }, {} as Record<string, { healthy: number; stale: number; missing: number }>);

    const locations = Object.keys(locationStats);
    
    if (locations.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          No asset data available
        </div>
      );
    }

    // Calculate grid layout
    const cols = Math.ceil(Math.sqrt(locations.length));
    const chartSize = Math.min(200, 400 / cols);

    return (
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {locations.map(location => {
          const stats = locationStats[location];
          const data = [
            { name: 'Healthy', value: stats.healthy, color: COLORS.healthy },
            { name: 'Stale', value: stats.stale, color: COLORS.stale },
            { name: 'Missing', value: stats.missing, color: COLORS.missing },
          ].filter(item => item.value && item.value > 0);

          return (
            <div key={location} className="text-center">
              <h4 className="text-sm font-medium mb-2 text-color-text-default">{location}</h4>
              <ResponsiveContainer width="100%" height={chartSize}>
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={chartSize * 0.35}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="text-xs text-color-text-lighter mt-1">
                {stats.healthy + stats.stale + stats.missing} assets
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Original single pie chart mode
  const data = [
    { name: 'Healthy', value: healthy, color: COLORS.healthy },
    { name: 'Stale', value: stale, color: COLORS.stale },
    { name: 'Missing', value: missing, color: COLORS.missing },
  ].filter(item => item.value && item.value > 0);

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