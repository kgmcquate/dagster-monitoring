import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Asset } from '../types/dagster';

interface ObservationsActivityChartProps {
  assets: Asset[];
}

interface ObservationDataPoint {
  date: string;
  observations: number;
  criticalObservations: number;
  warningObservations: number;
}

export default function ObservationsActivityChart({ assets }: ObservationsActivityChartProps) {
  const generateObservationData = (): ObservationDataPoint[] => {
    const days = 7;
    const observationData: ObservationDataPoint[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      let observations = 0;
      let criticalObservations = 0;
      let warningObservations = 0;
      
      assets.forEach(asset => {
        asset.assetObservations?.forEach(obs => {
          const obsDate = new Date(parseFloat(obs.timestamp)).toISOString().split('T')[0];
          if (obsDate === dateStr) {
            observations++;
            if (obs.level === 'CRITICAL' || obs.level === 'ERROR') {
              criticalObservations++;
            } else if (obs.level === 'WARNING') {
              warningObservations++;
            }
          }
        });
      });
      
      observationData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        observations,
        criticalObservations,
        warningObservations
      });
    }
    
    return observationData;
  };

  const observationData = generateObservationData();

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={observationData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
          <Area 
            type="monotone" 
            dataKey="observations" 
            stackId="1"
            stroke="var(--color-accent-blue)" 
            fill="rgba(79, 67, 221, 0.3)"
            name="Total Observations"
          />
          <Area 
            type="monotone" 
            dataKey="warningObservations" 
            stackId="2"
            stroke="var(--color-accent-yellow)" 
            fill="rgba(234, 177, 89, 0.3)"
            name="Warnings"
          />
          <Area 
            type="monotone" 
            dataKey="criticalObservations" 
            stackId="3"
            stroke="var(--color-accent-red)" 
            fill="rgba(210, 66, 53, 0.3)"
            name="Critical/Errors"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}