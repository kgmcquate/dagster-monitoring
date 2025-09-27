import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Asset } from '../types/dagster';
import { getDateRangeDays } from '../utils/dateUtils';

interface SuccessFailureTrendsChartProps {
  assets: Asset[];
  groupByCodeLocation?: boolean;
  dateRange?: string;
}

interface TrendDataPoint {
  date: string;
  successes: number;
  failures: number;
  total: number;
  [key: string]: string | number; // Allow dynamic properties for code location data
}

export default function SuccessFailureTrendsChart({ assets, groupByCodeLocation = false, dateRange = '7d' }: SuccessFailureTrendsChartProps) {
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  // Generate trend data for the selected date range
  const generateTrendData = (): TrendDataPoint[] => {
    const days = getDateRangeDays(dateRange);
    const groupByHour = days === 1; // Group by hour for 1-day range
    const trendData: TrendDataPoint[] = [];
    
    // Get unique code locations
    const codeLocations = Array.from(new Set(
      assets.map(asset => asset.definition?.repository?.location?.name || 'Unknown')
    ));
    
    if (groupByHour) {
      // Generate hourly data points for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i, 0, 0, 0);
        const hourStr = date.toISOString();
        
        const dataPoint: TrendDataPoint = {
          date: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          successes: 0,
          failures: 0,
          total: 0
        };
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            dataPoint[`${location}_successes`] = 0;
            dataPoint[`${location}_failures`] = 0;
            dataPoint[`${location}_total`] = 0;
          });
        }
        
        assets.forEach(asset => {
          const codeLocation = asset.definition?.repository?.location?.name || 'Unknown';
          
          asset.assetMaterializations?.forEach(mat => {
            const matDate = new Date(parseFloat(mat.timestamp));
            const matHour = new Date(matDate.getFullYear(), matDate.getMonth(), matDate.getDate(), matDate.getHours());
            const targetHour = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours());
            
            if (matHour.getTime() === targetHour.getTime()) {
              dataPoint.total++;
              
              if (groupByCodeLocation) {
                (dataPoint[`${codeLocation}_total`] as number) += 1;
              }
              
              if (mat.stepStats?.status === 'SUCCESS') {
                dataPoint.successes++;
                if (groupByCodeLocation) {
                  (dataPoint[`${codeLocation}_successes`] as number) += 1;
                }
              } else if (mat.stepStats?.status === 'FAILURE') {
                dataPoint.failures++;
                if (groupByCodeLocation) {
                  (dataPoint[`${codeLocation}_failures`] as number) += 1;
                }
              }
            }
          });
        });
        
        trendData.push(dataPoint);
      }
    } else {
      // Generate daily data points
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dataPoint: TrendDataPoint = {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          successes: 0,
          failures: 0,
          total: 0
        };
      
      if (groupByCodeLocation) {
        // Initialize counts for each code location
        codeLocations.forEach(location => {
          dataPoint[`${location}_successes`] = 0;
          dataPoint[`${location}_failures`] = 0;
          dataPoint[`${location}_total`] = 0;
        });
      }
      
        assets.forEach(asset => {
          const codeLocation = asset.definition?.repository?.location?.name || 'Unknown';
          
          asset.assetMaterializations?.forEach(mat => {
            const matDate = new Date(parseFloat(mat.timestamp)).toISOString().split('T')[0];
            if (matDate === dateStr) {
              dataPoint.total++;
              
              if (groupByCodeLocation) {
                (dataPoint[`${codeLocation}_total`] as number) += 1;
              }
              
              if (mat.stepStats?.status === 'SUCCESS') {
                dataPoint.successes++;
                if (groupByCodeLocation) {
                  (dataPoint[`${codeLocation}_successes`] as number) += 1;
                }
              } else if (mat.stepStats?.status === 'FAILURE') {
                dataPoint.failures++;
                if (groupByCodeLocation) {
                  (dataPoint[`${codeLocation}_failures`] as number) += 1;
                }
              }
            }
          });
        });
        
        trendData.push(dataPoint);
      }
    }    return trendData;
  };

  const trendData = generateTrendData();

  // Get unique code locations for grouped view
  const codeLocations = Array.from(new Set(
    assets.map(asset => asset.definition?.repository?.location?.name || 'Unknown')
  ));

  // Color palette for different code locations
  const colors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316'  // orange
  ];

  const renderLines = () => {
    if (groupByCodeLocation) {
      const lines: React.ReactElement[] = [];
      codeLocations.forEach((location, index) => {
        const baseColor = colors[index % colors.length];
        const isDashed = location === 'Unknown';
        const successKey = `${location}_successes`;
        const failureKey = `${location}_failures`;
        
        // Success line for this code location
        const isSuccessHovered = hoveredDataKey === successKey;
        const isSuccessDimmed = hoveredDataKey && hoveredDataKey !== successKey;
        
        lines.push(
          <Line
            key={successKey}
            type="monotone"
            dataKey={successKey}
            stroke={baseColor}
            strokeWidth={isSuccessHovered ? 4 : 2}
            strokeOpacity={isSuccessDimmed ? 0.3 : 1}
            name={`${location} Successes`}
            dot={{ fill: baseColor, strokeWidth: 2, r: isSuccessHovered ? 5 : 3 }}
            strokeDasharray={isDashed ? '5 5' : undefined}
          />
        );
        
        // Failure line for this code location (darker shade with red outline)
        const failureColor = baseColor.replace('0.8)', '0.5)'); // Make it darker
        const isFailureHovered = hoveredDataKey === failureKey;
        const isFailureDimmed = hoveredDataKey && hoveredDataKey !== failureKey;
        
        lines.push(
          <Line
            key={failureKey}
            type="monotone"
            dataKey={failureKey}
            stroke={failureColor}
            strokeWidth={isFailureHovered ? 4 : 2}
            strokeOpacity={isFailureDimmed ? 0.3 : 1}
            name={`${location} Failures`}
            dot={{ fill: failureColor, stroke: '#ef4444', strokeWidth: 2, r: isFailureHovered ? 5 : 3 }}
            strokeDasharray={isDashed ? '10 5' : '3 3'} // Different dash pattern for failures
          />
        );
      });
      return lines;
    } else {
      const isSuccessHovered = hoveredDataKey === 'successes';
      const isFailureHovered = hoveredDataKey === 'failures';
      const isTotalHovered = hoveredDataKey === 'total';
      const isSuccessDimmed = hoveredDataKey && hoveredDataKey !== 'successes';
      const isFailureDimmed = hoveredDataKey && hoveredDataKey !== 'failures';
      const isTotalDimmed = hoveredDataKey && hoveredDataKey !== 'total';
      
      return (
        <>
          <Line 
            type="monotone" 
            dataKey="successes" 
            stroke="var(--color-accent-green)" 
            strokeWidth={isSuccessHovered ? 4 : 2}
            strokeOpacity={isSuccessDimmed ? 0.3 : 1}
            name="Successes"
            dot={{ fill: 'var(--color-accent-green)', strokeWidth: 2, r: isSuccessHovered ? 6 : 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="failures" 
            stroke="var(--color-accent-red)" 
            strokeWidth={isFailureHovered ? 4 : 2}
            strokeOpacity={isFailureDimmed ? 0.3 : 1}
            name="Failures"
            dot={{ fill: 'var(--color-accent-red)', stroke: '#ef4444', strokeWidth: 3, r: isFailureHovered ? 6 : 4 }}
          />
          <Line 
            type="monotone" 
            dataKey="total" 
            stroke="var(--color-accent-blue)" 
            strokeWidth={isTotalHovered ? 4 : 2}
            strokeOpacity={isTotalDimmed ? 0.3 : 1}
            name="Total"
            dot={{ fill: 'var(--color-accent-blue)', strokeWidth: 2, r: isTotalHovered ? 6 : 4 }}
          />
        </>
      );
    }
  };



  return (
    <div className="h-80 flex gap-4">
      {/* Chart Area */}
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={trendData} margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
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
            {renderLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend Box */}
      <div className="w-48 bg-color-background-lighter border border-color-border rounded-lg p-3">
        <div className="space-y-2">
          {(() => {
            if (groupByCodeLocation) {
              // For grouped view, only show code location specific entries
              const legendItems: React.ReactElement[] = [];
              codeLocations.forEach((location, index) => {
                const baseColor = colors[index % colors.length];
                
                // Add success entry
                legendItems.push(
                  <div 
                    key={`${location}_successes`}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                    onMouseEnter={() => setHoveredDataKey(`${location}_successes`)}
                    onMouseLeave={() => setHoveredDataKey(null)}
                  >
                    <div className="relative">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: baseColor }}
                      />
                    </div>
                    <span className="text-color-text-default text-xs leading-tight">{location} Successes</span>
                  </div>
                );
                
                // Add failure entry
                const failureColor = baseColor.replace('0.8)', '0.5)');
                legendItems.push(
                  <div 
                    key={`${location}_failures`}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                    onMouseEnter={() => setHoveredDataKey(`${location}_failures`)}
                    onMouseLeave={() => setHoveredDataKey(null)}
                  >
                    <div className="relative">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: failureColor }}
                      />
                      <div 
                        className="absolute inset-0 w-3 h-3 rounded-full border-2" 
                        style={{ borderColor: '#ef4444' }}
                      />
                    </div>
                    <span className="text-color-text-default text-xs leading-tight">{location} Failures</span>
                  </div>
                );
              });
              return legendItems;
            } else {
              // For ungrouped view, show traditional entries
              return [
                <div 
                  key="successes"
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                  onMouseEnter={() => setHoveredDataKey('successes')}
                  onMouseLeave={() => setHoveredDataKey(null)}
                >
                  <div className="relative">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: 'var(--color-accent-green)' }}
                    />
                  </div>
                  <span className="text-color-text-default text-xs leading-tight">Successes</span>
                </div>,
                <div 
                  key="failures"
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                  onMouseEnter={() => setHoveredDataKey('failures')}
                  onMouseLeave={() => setHoveredDataKey(null)}
                >
                  <div className="relative">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: 'var(--color-accent-red)' }}
                    />
                    <div 
                      className="absolute inset-0 w-3 h-3 rounded-full border-2" 
                      style={{ borderColor: '#ef4444' }}
                    />
                  </div>
                  <span className="text-color-text-default text-xs leading-tight">Failures</span>
                </div>,
                <div 
                  key="total"
                  className="flex items-center gap-2 text-sm cursor-pointer hover:bg-color-background-default p-1 rounded transition-colors"
                  onMouseEnter={() => setHoveredDataKey('total')}
                  onMouseLeave={() => setHoveredDataKey(null)}
                >
                  <div className="relative">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: 'var(--color-accent-blue)' }}
                    />
                  </div>
                  <span className="text-color-text-default text-xs leading-tight">Total</span>
                </div>
              ];
            }
          })()
          }
        </div>
      </div>
    </div>
  );
}