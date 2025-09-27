import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Asset, LogLevel } from '../types/dagster';
import { getDateRangeDays } from '../utils/dateUtils';

interface ObservationsActivityChartProps {
  assets: Asset[];
  groupByCodeLocation?: boolean;
  dateRange?: string;
}

interface ObservationDataPoint {
  date: string;
  observations: number;
  criticalObservations: number;
  warningObservations: number;
  [key: string]: string | number; // Allow dynamic properties for code location data
}

export default function ObservationsActivityChart({ assets, groupByCodeLocation = false, dateRange = '7d' }: ObservationsActivityChartProps) {
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  const generateObservationData = (): ObservationDataPoint[] => {
    const days = getDateRangeDays(dateRange);
    const groupByHour = days === 1; // Group by hour for 1-day range
    const observationData: ObservationDataPoint[] = [];
    
    // Get unique code locations
    const codeLocations = Array.from(new Set(
      assets.map(asset => asset.definition?.repository?.location?.name || 'Unknown')
    ));
    
    if (groupByHour) {
      // Generate hourly data points for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i, 0, 0, 0);
        
        const dataPoint: ObservationDataPoint = {
          date: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          observations: 0,
          criticalObservations: 0,
          warningObservations: 0
        };
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            dataPoint[`${location}_observations`] = 0;
            dataPoint[`${location}_criticalObservations`] = 0;
            dataPoint[`${location}_warningObservations`] = 0;
          });
        }
        
        assets.forEach(asset => {
          const codeLocation = asset.definition?.repository?.location?.name || 'Unknown';
          
          asset.assetObservations?.forEach(obs => {
            const obsDate = new Date(parseFloat(obs.timestamp));
            const obsHour = new Date(obsDate.getFullYear(), obsDate.getMonth(), obsDate.getDate(), obsDate.getHours());
            const targetHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
            
            if (obsHour.getTime() === targetHour.getTime()) {
              dataPoint.observations++;
              
              if (groupByCodeLocation) {
                (dataPoint[`${codeLocation}_observations`] as number) += 1;
              }
              
              if (obs.level === LogLevel.CRITICAL || obs.level === LogLevel.ERROR) {
                dataPoint.criticalObservations++;
                if (groupByCodeLocation) {
                  (dataPoint[`${codeLocation}_criticalObservations`] as number) += 1;
                }
              } else if (obs.level === LogLevel.WARNING) {
                dataPoint.warningObservations++;
                if (groupByCodeLocation) {
                  (dataPoint[`${codeLocation}_warningObservations`] as number) += 1;
                }
              }
            }
          });
        });
        
        observationData.push(dataPoint);
      }
    } else {
      // Generate daily data points
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dataPoint: ObservationDataPoint = {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          observations: 0,
          criticalObservations: 0,
          warningObservations: 0
        };
        
        if (groupByCodeLocation) {
          // Initialize counts for each code location
          codeLocations.forEach(location => {
            dataPoint[`${location}_observations`] = 0;
            dataPoint[`${location}_criticalObservations`] = 0;
            dataPoint[`${location}_warningObservations`] = 0;
          });
        }
        
        assets.forEach(asset => {
          const codeLocation = asset.definition?.repository?.location?.name || 'Unknown';
          
          asset.assetObservations?.forEach(obs => {
            const obsDate = new Date(parseFloat(obs.timestamp)).toISOString().split('T')[0];
            if (obsDate === dateStr) {
              dataPoint.observations++;
              
              if (groupByCodeLocation) {
                (dataPoint[`${codeLocation}_observations`] as number) += 1;
              }
              
              if (obs.level === LogLevel.CRITICAL || obs.level === LogLevel.ERROR) {
                dataPoint.criticalObservations++;
                if (groupByCodeLocation) {
                  (dataPoint[`${codeLocation}_criticalObservations`] as number) += 1;
                }
              } else if (obs.level === LogLevel.WARNING) {
                dataPoint.warningObservations++;
                if (groupByCodeLocation) {
                  (dataPoint[`${codeLocation}_warningObservations`] as number) += 1;
                }
              }
            }
          });
        });
        
        observationData.push(dataPoint);
      }
    }
    
    return observationData;
  };

  const observationData = generateObservationData();
  
  // Get unique code locations for rendering
  const uniqueCodeLocations = Array.from(new Set(
    assets.map(asset => asset.definition?.repository?.location?.name || 'Unknown')
  ));

  const getCodeLocationColor = (_location: string, index: number) => {
    const colors = [
      { fill: 'rgba(79, 67, 221, 0.3)', stroke: '#4f43dd' },   // Purple
      { fill: 'rgba(16, 185, 129, 0.3)', stroke: '#10b981' },  // Green
      { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3b82f6' },  // Blue
      { fill: 'rgba(245, 158, 11, 0.3)', stroke: '#f59e0b' },  // Yellow
      { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444' },   // Red
      { fill: 'rgba(139, 92, 246, 0.3)', stroke: '#8b5cf6' },  // Violet
      { fill: 'rgba(34, 197, 94, 0.3)', stroke: '#22c55e' },   // Lime
      { fill: 'rgba(168, 85, 247, 0.3)', stroke: '#a855f7' }   // Purple alt
    ];
    return colors[index % colors.length];
  };

  const areas: React.ReactElement[] = [];

  if (groupByCodeLocation) {
    // Render areas for each code location
    uniqueCodeLocations.forEach((location, index) => {
      const baseColor = getCodeLocationColor(location, index);
      const obsKey = `${location}_observations`;
      const warnKey = `${location}_warningObservations`;
      const critKey = `${location}_criticalObservations`;
      
      const isObsHovered = hoveredDataKey === obsKey;
      const isWarnHovered = hoveredDataKey === warnKey;
      const isCritHovered = hoveredDataKey === critKey;
      
      const isObsDimmed = hoveredDataKey && !isObsHovered && !isWarnHovered && !isCritHovered;
      const isWarnDimmed = hoveredDataKey && !isWarnHovered && !isObsHovered && !isCritHovered;
      const isCritDimmed = hoveredDataKey && !isCritHovered && !isObsHovered && !isWarnHovered;

      // Regular observations
      areas.push(
        <Area
          key={obsKey}
          type="monotone"
          dataKey={obsKey}
          stackId="1"
          stroke={baseColor.stroke}
          strokeWidth={isObsHovered ? 4 : 2}
          fill={baseColor.fill}
          fillOpacity={isObsDimmed ? 0.1 : 0.3}
          name={`${location} Observations`}
          strokeDasharray={location === 'Unknown' ? '5 5' : undefined}
        />
      );

      // Warning observations
      areas.push(
        <Area
          key={warnKey}
          type="monotone"
          dataKey={warnKey}
          stackId="2"
          stroke="#eab159"
          strokeWidth={isWarnHovered ? 4 : 2}
          fill={baseColor.fill}
          fillOpacity={isWarnDimmed ? 0.1 : 0.3}
          name={`${location} Warnings`}
          strokeDasharray={location === 'Unknown' ? '5 5' : undefined}
        />
      );

      // Critical observations
      areas.push(
        <Area
          key={critKey}
          type="monotone"
          dataKey={critKey}
          stackId="3"
          stroke="#d24235"
          strokeWidth={isCritHovered ? 4 : 2}
          fill={baseColor.fill}
          fillOpacity={isCritDimmed ? 0.1 : 0.3}
          name={`${location} Critical`}
          strokeDasharray={location === 'Unknown' ? '5 5' : undefined}
        />
      );
    });
  } else {
    // Render single areas for all observations
    const isObsHovered = hoveredDataKey === 'observations';
    const isWarnHovered = hoveredDataKey === 'warningObservations';
    const isCritHovered = hoveredDataKey === 'criticalObservations';
    
    const isObsDimmed = hoveredDataKey && !isObsHovered;
    const isWarnDimmed = hoveredDataKey && !isWarnHovered;
    const isCritDimmed = hoveredDataKey && !isCritHovered;

    areas.push(
      <Area
        key="observations"
        type="monotone"
        dataKey="observations"
        stackId="1"
        stroke="#3b82f6"
        strokeWidth={isObsHovered ? 4 : 2}
        fill="rgba(59, 130, 246, 0.3)"
        fillOpacity={isObsDimmed ? 0.1 : 0.3}
        name="Observations"
      />
    );

    areas.push(
      <Area
        key="warningObservations"
        type="monotone"
        dataKey="warningObservations"
        stackId="2"
        stroke="#eab159"
        strokeWidth={isWarnHovered ? 4 : 2}
        fill="rgba(234, 177, 89, 0.3)"
        fillOpacity={isWarnDimmed ? 0.1 : 0.3}
        name="Warnings"
      />
    );

    areas.push(
      <Area
        key="criticalObservations"
        type="monotone"
        dataKey="criticalObservations"
        stackId="3"
        stroke="#d24235"
        strokeWidth={isCritHovered ? 4 : 2}
        fill="rgba(210, 66, 53, 0.3)"
        fillOpacity={isCritDimmed ? 0.1 : 0.3}
        name="Critical/Errors"
      />
    );
  }

  return (
    <div className="flex">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={observationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis 
              dataKey="date" 
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
            />
            {areas}
          </AreaChart>  
        </ResponsiveContainer>
      </div>
      
      {/* Side Legend */}
      <div className="ml-6 flex flex-col justify-center space-y-2">
        <div className="text-xs font-medium text-color-text-light mb-2">Legend</div>
        {groupByCodeLocation ? (
          (() => {
            const legendItems: React.ReactElement[] = [];
            uniqueCodeLocations.forEach((location, index) => {
              const baseColor = getCodeLocationColor(location, index);
              const obsKey = `${location}_observations`;
              const warnKey = `${location}_warningObservations`;
              const critKey = `${location}_criticalObservations`;
              
              legendItems.push(
                <div key={`${location}-obs`} className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                     onMouseEnter={() => setHoveredDataKey(obsKey)}
                     onMouseLeave={() => setHoveredDataKey(null)}>
                  <div className="w-3 h-3 rounded-sm border" 
                       style={{ 
                         backgroundColor: baseColor.fill, 
                         borderColor: baseColor.stroke 
                       }} />
                  <span className="text-color-text-default text-xs leading-tight">{location}</span>
                </div>
              );
              
              legendItems.push(
                <div key={`${location}-warn`} className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                     onMouseEnter={() => setHoveredDataKey(warnKey)}
                     onMouseLeave={() => setHoveredDataKey(null)}>
                  <div className="w-3 h-3 rounded-sm border-2" 
                       style={{ 
                         backgroundColor: baseColor.fill, 
                         borderColor: '#eab159' 
                       }} />
                  <span className="text-color-text-default text-xs leading-tight">{location} Warns</span>
                </div>
              );
              
              legendItems.push(
                <div key={`${location}-crit`} className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                     onMouseEnter={() => setHoveredDataKey(critKey)}
                     onMouseLeave={() => setHoveredDataKey(null)}>
                  <div className="w-3 h-3 rounded-sm border-2" 
                       style={{ 
                         backgroundColor: baseColor.fill, 
                         borderColor: '#d24235' 
                       }} />
                  <span className="text-color-text-default text-xs leading-tight">{location} Critical</span>
                </div>
              );
            });
            return legendItems;
          })()
        ) : (
          [
            <div key="observations" className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                 onMouseEnter={() => setHoveredDataKey('observations')}
                 onMouseLeave={() => setHoveredDataKey(null)}>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.3)', border: '1px solid #3b82f6' }} />
              <span className="text-color-text-default text-xs leading-tight">Observations</span>
            </div>,
            <div key="warnings" className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                 onMouseEnter={() => setHoveredDataKey('warningObservations')}
                 onMouseLeave={() => setHoveredDataKey(null)}>
              <div className="w-3 h-3 rounded-sm border-2" 
                   style={{ 
                     backgroundColor: 'rgba(234, 177, 89, 0.3)', 
                     borderColor: '#eab159' 
                   }} />
              <span className="text-color-text-default text-xs leading-tight">Warnings</span>
            </div>,
            <div key="critical" className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                 onMouseEnter={() => setHoveredDataKey('criticalObservations')}
                 onMouseLeave={() => setHoveredDataKey(null)}>
              <div className="w-3 h-3 rounded-sm border-2" 
                   style={{ 
                     backgroundColor: 'rgba(210, 66, 53, 0.3)', 
                     borderColor: '#d24235' 
                   }} />
              <span className="text-color-text-default text-xs leading-tight">Critical/Errors</span>
            </div>
          ]
        )}
      </div>
    </div>
  );
}