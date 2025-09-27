import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Asset } from '../../types/dagster';

interface CodeLocationDistributionChartProps {
  assets: Asset[];
}

interface LocationData {
  location: string;
  total: number;
  healthy: number;
  stale: number;
  missing: number;
  successRate: number;
}

export default function CodeLocationDistributionChart({ assets }: CodeLocationDistributionChartProps) {
  const generateLocationData = (): LocationData[] => {
    const locationMap = new Map<string, {
      total: number;
      healthy: number;
      stale: number;
      missing: number;
      successes: number;
      totalRuns: number;
    }>();

    assets.forEach(asset => {
      const location = asset.definition?.groupName || 'Unknown';
      
      if (!locationMap.has(location)) {
        locationMap.set(location, {
          total: 0,
          healthy: 0,
          stale: 0,
          missing: 0,
          successes: 0,
          totalRuns: 0
        });
      }

      const locationData = locationMap.get(location)!;
      locationData.total++;

      // Calculate asset health
      const hasRecentMat = asset.assetMaterializations && asset.assetMaterializations.length > 0;
      if (!hasRecentMat) {
        locationData.missing++;
      } else {
        const lastMat = asset.assetMaterializations[0];
        const lastMatTime = new Date(parseFloat(lastMat.timestamp));
        const hoursSince = (Date.now() - lastMatTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSince < 24) {
          locationData.healthy++;
        } else {
          locationData.stale++;
        }
      }

      // Calculate success rate
      asset.assetMaterializations?.forEach(mat => {
        locationData.totalRuns++;
        if (mat.stepStats?.status === 'SUCCESS') {
          locationData.successes++;
        }
      });
    });

    return Array.from(locationMap.entries()).map(([location, data]) => ({
      location: location.length > 15 ? location.substring(0, 15) + '...' : location,
      total: data.total,
      healthy: data.healthy,
      stale: data.stale,
      missing: data.missing,
      successRate: data.totalRuns > 0 ? Math.round((data.successes / data.totalRuns) * 100) : 0
    }));
  };

  const locationData = generateLocationData();
  const colors = ['var(--color-accent-blue)', 'var(--color-accent-green)', 'var(--color-accent-yellow)', 'var(--color-accent-red)'];

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={locationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
          <XAxis 
            dataKey="location" 
            stroke="var(--color-text-light)"
            fontSize={12}
            angle={-45}
            textAnchor="end"
            height={80}
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
            formatter={(value, name) => [
              value,
              name === 'total' ? 'Total Assets' :
              name === 'successRate' ? 'Success Rate (%)' : name
            ]}
          />
          <Bar dataKey="total" name="total" radius={[4, 4, 0, 0]}>
            {locationData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}