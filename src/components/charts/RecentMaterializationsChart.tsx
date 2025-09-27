import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Asset } from '../../types/dagster';

interface RecentMaterializationsChartProps {
  assets: Asset[];
}

export default function RecentMaterializationsChart({ assets }: RecentMaterializationsChartProps) {
  // Generate data for the last 7 days
  const generateChartData = () => {
    const days = 7;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Count materializations for this day
      let count = 0;
      assets.forEach(asset => {
        asset.assetMaterializations?.forEach(mat => {
          const matDate = new Date(parseFloat(mat.timestamp)).toISOString().split('T')[0];
          if (matDate === dateStr) {
            count++;
          }
        });
      });
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        materializations: count,
      });
    }
    
    return data;
  };

  const data = generateChartData();

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line 
          key="materializations"
          type="monotone" 
          dataKey="materializations" 
          stroke="#0ea5e9" 
          strokeWidth={2}
          dot={{ fill: '#0ea5e9' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}