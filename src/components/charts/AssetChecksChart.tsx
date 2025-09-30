import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Asset } from '../../types/dagster';
import { getDateRangeDays } from '../../utils/dateUtils';
import { getCodeLocationChartColors } from '../../utils/codeLocationColors';

interface AssetChecksChartProps {
  assets: Asset[];
  groupByCodeLocation?: boolean;
  dateRange?: string;
}

interface ChecksDataPoint {
  date: string;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  [key: string]: string | number; // Allow dynamic properties for code location data
}

export default function AssetChecksChart({ assets, groupByCodeLocation = false, dateRange = '7d' }: AssetChecksChartProps) {
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  const generateChecksData = (): ChecksDataPoint[] => {
    const days = getDateRangeDays(dateRange);
    const groupByHour = days === 1; // Group by hour for 1-day range
    const checksData: ChecksDataPoint[] = [];
    
    // Get unique code locations
    const codeLocations = Array.from(new Set(
      assets.map(asset => asset.definition?.repository?.location?.name || 'Unknown')
    ));
    
    if (groupByHour) {
      // Generate hourly data points for the last 24 hours
      for (let i = 23; i >= 0; i--) {
        const date = new Date();
        date.setHours(date.getHours() - i, 0, 0, 0);
        
        const dataPoint: ChecksDataPoint = {
          date: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0
        };
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            dataPoint[`${location}_totalChecks`] = 0;
            dataPoint[`${location}_passedChecks`] = 0;
            dataPoint[`${location}_failedChecks`] = 0;
          });
        }
        
        // Generate mock data for now - in a real implementation this would come from actual asset checks
        // This simulates the pattern of asset checks throughout the day
        const hourOfDay = date.getHours();
        const baseChecks = Math.max(1, Math.floor(Math.random() * 10) + (hourOfDay >= 9 && hourOfDay <= 17 ? 5 : 2));
        const failed = Math.floor(Math.random() * Math.max(1, baseChecks * 0.2));
        const passed = baseChecks - failed;
        
        dataPoint.totalChecks = baseChecks;
        dataPoint.passedChecks = passed;
        dataPoint.failedChecks = failed;
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            const locationChecks = Math.floor(baseChecks / codeLocations.length) + Math.floor(Math.random() * 3);
            const locationFailed = Math.floor(Math.random() * Math.max(1, locationChecks * 0.2));
            const locationPassed = locationChecks - locationFailed;
            
            dataPoint[`${location}_totalChecks`] = locationChecks;
            dataPoint[`${location}_passedChecks`] = locationPassed;
            dataPoint[`${location}_failedChecks`] = locationFailed;
          });
        }
        
        checksData.push(dataPoint);
      }
    } else {
      // Generate daily data points
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        const dataPoint: ChecksDataPoint = {
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          totalChecks: 0,
          passedChecks: 0,
          failedChecks: 0
        };
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            dataPoint[`${location}_totalChecks`] = 0;
            dataPoint[`${location}_passedChecks`] = 0;
            dataPoint[`${location}_failedChecks`] = 0;
          });
        }
        
        // Generate mock data for daily trends
        const baseChecks = Math.floor(Math.random() * 25) + 10; // 10-35 checks per day
        const failed = Math.floor(Math.random() * Math.max(1, baseChecks * 0.15));
        const passed = baseChecks - failed;
        
        dataPoint.totalChecks = baseChecks;
        dataPoint.passedChecks = passed;
        dataPoint.failedChecks = failed;
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            const locationChecks = Math.floor(baseChecks / codeLocations.length) + Math.floor(Math.random() * 5);
            const locationFailed = Math.floor(Math.random() * Math.max(1, locationChecks * 0.15));
            const locationPassed = locationChecks - locationFailed;
            
            dataPoint[`${location}_totalChecks`] = locationChecks;
            dataPoint[`${location}_passedChecks`] = locationPassed;
            dataPoint[`${location}_failedChecks`] = locationFailed;
          });
        }
        
        checksData.push(dataPoint);
      }
    }
    
    return checksData;
  };

  const checksData = generateChecksData();
  
  // Get unique code locations for rendering
  const uniqueCodeLocations = Array.from(new Set(
    assets.map(asset => asset.definition?.repository?.location?.name || 'Unknown')
  ));

  // Use centralized color function for consistent coloring
  const getLocationColors = (location: string) => getCodeLocationChartColors(location);

  const renderLines = () => {
    const lines: React.ReactElement[] = [];

    if (groupByCodeLocation) {
      // Render lines for each code location
      uniqueCodeLocations.forEach((location) => {
        const baseColor = getLocationColors(location);
        const passedKey = `${location}_passedChecks`;
        const failedKey = `${location}_failedChecks`;
        
        const isPassedHovered = hoveredDataKey === passedKey;
        const isFailedHovered = hoveredDataKey === failedKey;
        
        const isPassedDimmed = hoveredDataKey && !isPassedHovered;
        const isFailedDimmed = hoveredDataKey && !isFailedHovered;

        // Passed checks line
        lines.push(
          <Line
            key={passedKey}
            type="linear"
            dataKey={passedKey}
            stroke="#10b981"
            strokeWidth={isPassedHovered ? 4 : 2}
            strokeOpacity={isPassedDimmed ? 0.3 : 1}
            name={`${location} Passed`}
            dot={{ 
              fill: '#10b981', 
              strokeWidth: 2, 
              r: isPassedHovered ? 5 : 3,
              fillOpacity: isPassedDimmed ? 0.3 : 1
            }}
            strokeDasharray={location === 'Unknown' ? '5 5' : undefined}
          />
        );

        // Failed checks line
        lines.push(
          <Line
            key={failedKey}
            type="linear"
            dataKey={failedKey}
            stroke="#ef4444"
            strokeWidth={isFailedHovered ? 4 : 2}
            strokeOpacity={isFailedDimmed ? 0.3 : 1}
            name={`${location} Failed`}
            dot={{ 
              fill: '#ef4444', 
              strokeWidth: 2, 
              r: isFailedHovered ? 5 : 3,
              fillOpacity: isFailedDimmed ? 0.3 : 1
            }}
            strokeDasharray={location === 'Unknown' ? '5 5' : undefined}
          />
        );
      });
    } else {
      // Render single lines for all checks
      const isPassedHovered = hoveredDataKey === 'passedChecks';
      const isFailedHovered = hoveredDataKey === 'failedChecks';
      const isTotalHovered = hoveredDataKey === 'totalChecks';
      
      const isPassedDimmed = hoveredDataKey && !isPassedHovered;
      const isFailedDimmed = hoveredDataKey && !isFailedHovered;
      const isTotalDimmed = hoveredDataKey && !isTotalHovered;

      lines.push(
        <Line
          key="passedChecks"
          type="linear"
          dataKey="passedChecks"
          stroke="#10b981"
          strokeWidth={isPassedHovered ? 4 : 2}
          strokeOpacity={isPassedDimmed ? 0.3 : 1}
          name="Passed Checks"
          dot={{ 
            fill: '#10b981', 
            strokeWidth: 2, 
            r: isPassedHovered ? 5 : 3,
            fillOpacity: isPassedDimmed ? 0.3 : 1
          }}
        />
      );

      lines.push(
        <Line
          key="failedChecks"
          type="linear"
          dataKey="failedChecks"
          stroke="#ef4444"
          strokeWidth={isFailedHovered ? 4 : 2}
          strokeOpacity={isFailedDimmed ? 0.3 : 1}
          name="Failed Checks"
          dot={{ 
            fill: '#ef4444', 
            strokeWidth: 2, 
            r: isFailedHovered ? 5 : 3,
            fillOpacity: isFailedDimmed ? 0.3 : 1
          }}
        />
      );

      lines.push(
        <Line
          key="totalChecks"
          type="linear"
          dataKey="totalChecks"
          stroke="#3b82f6"
          strokeWidth={isTotalHovered ? 4 : 2}
          strokeOpacity={isTotalDimmed ? 0.3 : 1}
          name="Total Checks"
          dot={{ 
            fill: '#3b82f6', 
            strokeWidth: 2, 
            r: isTotalHovered ? 5 : 3,
            fillOpacity: isTotalDimmed ? 0.3 : 1
          }}
        />
      );
    }

    return lines;
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={checksData}>
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
            {renderLines()}
          </LineChart>  
        </ResponsiveContainer>
      </div>
      
      {/* Side Legend */}
      <div className="ml-6 flex flex-col justify-center space-y-2">
        <div className="text-xs font-medium text-color-text-light mb-2">Legend</div>
        {groupByCodeLocation ? (
          (() => {
            const legendItems: React.ReactElement[] = [];
            uniqueCodeLocations.forEach((location) => {
              const passedKey = `${location}_passedChecks`;
              const failedKey = `${location}_failedChecks`;
              
              legendItems.push(
                <div key={`${location}-passed`} className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                     onMouseEnter={() => setHoveredDataKey(passedKey)}
                     onMouseLeave={() => setHoveredDataKey(null)}>
                  <div className="w-3 h-3 rounded-sm" 
                       style={{ backgroundColor: '#10b981' }} />
                  <span className="text-color-text-default text-xs leading-tight">{location} Passed</span>
                </div>
              );
              
              legendItems.push(
                <div key={`${location}-failed`} className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                     onMouseEnter={() => setHoveredDataKey(failedKey)}
                     onMouseLeave={() => setHoveredDataKey(null)}>
                  <div className="w-3 h-3 rounded-sm" 
                       style={{ backgroundColor: '#ef4444' }} />
                  <span className="text-color-text-default text-xs leading-tight">{location} Failed</span>
                </div>
              );
            });
            return legendItems;
          })()
        ) : (
          [
            <div key="passed" className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                 onMouseEnter={() => setHoveredDataKey('passedChecks')}
                 onMouseLeave={() => setHoveredDataKey(null)}>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#10b981' }} />
              <span className="text-color-text-default text-xs leading-tight">Passed Checks</span>
            </div>,
            <div key="failed" className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                 onMouseEnter={() => setHoveredDataKey('failedChecks')}
                 onMouseLeave={() => setHoveredDataKey(null)}>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-color-text-default text-xs leading-tight">Failed Checks</span>
            </div>,
            <div key="total" className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                 onMouseEnter={() => setHoveredDataKey('totalChecks')}
                 onMouseLeave={() => setHoveredDataKey(null)}>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />
              <span className="text-color-text-default text-xs leading-tight">Total Checks</span>
            </div>
          ]
        )}
      </div>
    </div>
  );
}