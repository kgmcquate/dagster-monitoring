import React, { useState } from 'react';
import { useQuery } from '@apollo/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Asset, AssetCheck, AssetCheckExecutionStatus } from '../../types/dagster';
import { AllAssetChecksResponse } from '../../types/graphql';
import { GET_ALL_ASSET_CHECKS } from '../../graphql/queries';
import { getDateRangeDays } from '../../utils/dateUtils';
import { getCodeLocationChartColors } from '../../utils/codeLocationColors';
import { LoadingSpinner, ErrorMessage } from '../ui';

interface AssetChecksChartProps {
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

export default function AssetChecksChart({ groupByCodeLocation = false, dateRange = '7d' }: AssetChecksChartProps) {
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);

  // Fetch real asset checks data
  const { loading, error, data } = useQuery<AllAssetChecksResponse>(GET_ALL_ASSET_CHECKS, {
    pollInterval: 30000,
  });

  const generateChecksData = (): ChecksDataPoint[] => {
    if (!data?.assetNodes) return [];
    
    // Extract all asset checks with their execution data
    const allChecks: Array<AssetCheck & { codeLocation: string }> = [];
    
    data.assetNodes.forEach((assetNode) => {
      if (assetNode.assetChecksOrError?.checks) {
        const codeLocation = assetNode.repository?.location?.name || 'Unknown';
        assetNode.assetChecksOrError.checks.forEach((check) => {
          allChecks.push({
            ...check,
            codeLocation
          });
        });
      }
    });
    const days = getDateRangeDays(dateRange);
    const groupByHour = days === 1; // Group by hour for 1-day range
    const checksData: ChecksDataPoint[] = [];
    
    // Get unique code locations from actual data
    const codeLocations = Array.from(new Set(allChecks.map(check => check.codeLocation)));
    
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
        
        // Count checks executed in this time period
        const periodStart = date;
        const periodEnd = new Date(date);
        periodEnd.setHours(periodEnd.getHours() + 1);
        
        const periodChecks = allChecks.filter(check => {
          const execution = check.executionForLatestMaterialization;
          if (!execution?.timestamp) return false;
          
          const executionTime = new Date(parseInt(execution.timestamp) * 1000);
          return executionTime >= periodStart && executionTime < periodEnd;
        });
        
        const passedInPeriod = periodChecks.filter(check => {
          const execution = check.executionForLatestMaterialization;
          return execution?.evaluation?.success === true || execution?.status === AssetCheckExecutionStatus.SUCCESS;
        });
        
        const failedInPeriod = periodChecks.filter(check => {
          const execution = check.executionForLatestMaterialization;
          return execution?.evaluation?.success === false || execution?.status === AssetCheckExecutionStatus.FAILURE;
        });
        
        dataPoint.totalChecks = periodChecks.length;
        dataPoint.passedChecks = passedInPeriod.length;
        dataPoint.failedChecks = failedInPeriod.length;
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            const locationChecks = periodChecks.filter(check => check.codeLocation === location);
            const locationPassed = passedInPeriod.filter(check => check.codeLocation === location);
            const locationFailed = failedInPeriod.filter(check => check.codeLocation === location);
            
            dataPoint[`${location}_totalChecks`] = locationChecks.length;
            dataPoint[`${location}_passedChecks`] = locationPassed.length;
            dataPoint[`${location}_failedChecks`] = locationFailed.length;
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
        
        // Count checks executed in this day
        const periodStart = date;
        const periodEnd = new Date(date);
        periodEnd.setHours(23, 59, 59, 999);
        
        const periodChecks = allChecks.filter(check => {
          const execution = check.executionForLatestMaterialization;
          if (!execution?.timestamp) return false;
          
          const executionTime = new Date(parseInt(execution.timestamp) * 1000);
          return executionTime >= periodStart && executionTime <= periodEnd;
        });
        
        const passedInPeriod = periodChecks.filter(check => {
          const execution = check.executionForLatestMaterialization;
          return execution?.evaluation?.success === true || execution?.status === AssetCheckExecutionStatus.SUCCESS;
        });
        
        const failedInPeriod = periodChecks.filter(check => {
          const execution = check.executionForLatestMaterialization;
          return execution?.evaluation?.success === false || execution?.status === AssetCheckExecutionStatus.FAILURE;
        });
        
        dataPoint.totalChecks = periodChecks.length;
        dataPoint.passedChecks = passedInPeriod.length;
        dataPoint.failedChecks = failedInPeriod.length;
        
        if (groupByCodeLocation) {
          codeLocations.forEach(location => {
            const locationChecks = periodChecks.filter(check => check.codeLocation === location);
            const locationPassed = passedInPeriod.filter(check => check.codeLocation === location);
            const locationFailed = failedInPeriod.filter(check => check.codeLocation === location);
            
            dataPoint[`${location}_totalChecks`] = locationChecks.length;
            dataPoint[`${location}_passedChecks`] = locationPassed.length;
            dataPoint[`${location}_failedChecks`] = locationFailed.length;
          });
        }
        
        checksData.push(dataPoint);
      }
    }
    
    return checksData;
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const checksData = generateChecksData();
  
  // Get unique code locations for rendering from actual data
  const uniqueCodeLocations = Array.from(new Set(
    data?.assetNodes?.map(node => node.repository?.location?.name || 'Unknown') || []
  ));

  // Use centralized color function for consistent coloring
  const getLocationColors = (location: string) => getCodeLocationChartColors(location);

  const renderLines = () => {
    const lines: React.ReactElement[] = [];

    if (groupByCodeLocation) {
      // Render lines for each code location
      uniqueCodeLocations.forEach((location) => {
        const baseColor = getLocationColors(location);
        const locationColor = baseColor.stroke; // Use the stroke color for the line
        const passedKey = `${location}_passedChecks`;
        const failedKey = `${location}_failedChecks`;
        
        const isPassedHovered = hoveredDataKey === passedKey;
        const isFailedHovered = hoveredDataKey === failedKey;
        
        const isPassedDimmed = hoveredDataKey && !isPassedHovered;
        const isFailedDimmed = hoveredDataKey && !isFailedHovered;

        // Passed checks line - colored by code location
        lines.push(
          <Line
            key={passedKey}
            type="linear"
            dataKey={passedKey}
            stroke={locationColor}
            strokeWidth={isPassedHovered ? 4 : 2}
            strokeOpacity={isPassedDimmed ? 0.3 : 1}
            name={`${location} Passed`}
            dot={{ 
              fill: locationColor, 
              stroke: 'var(--color-accent-success)', // Green outline for passed checks
              strokeWidth: 2, 
              r: isPassedHovered ? 5 : 3,
              fillOpacity: isPassedDimmed ? 0.3 : 1
            }}
            strokeDasharray={location === 'Unknown' ? '5 5' : undefined}
          />
        );

        // Failed checks line - colored by code location with red outline
        lines.push(
          <Line
            key={failedKey}
            type="linear"
            dataKey={failedKey}
            stroke={locationColor}
            strokeWidth={isFailedHovered ? 4 : 2}
            strokeOpacity={isFailedDimmed ? 0.3 : 1}
            name={`${location} Failed`}
            dot={{ 
              fill: locationColor, 
              stroke: 'var(--color-accent-failure)', // Red outline for failed checks
              strokeWidth: 3, // Thicker outline for failures
              r: isFailedHovered ? 6 : 4, // Slightly larger dots for failures
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
          stroke="var(--color-accent-success)"
          strokeWidth={isPassedHovered ? 4 : 2}
          strokeOpacity={isPassedDimmed ? 0.3 : 1}
          name="Passed Checks"
          dot={{ 
            fill: 'var(--color-accent-success)', 
            stroke: 'var(--color-accent-success)',
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
          stroke="var(--color-accent-failure)"
          strokeWidth={isFailedHovered ? 4 : 2}
          strokeOpacity={isFailedDimmed ? 0.3 : 1}
          name="Failed Checks"
          dot={{ 
            fill: 'var(--color-accent-failure)', 
            stroke: 'var(--color-accent-failure)', // Red outline for failed checks
            strokeWidth: 3, // Thicker outline for failures
            r: isFailedHovered ? 6 : 4, // Slightly larger dots for failures
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
              const baseColor = getLocationColors(location);
              const locationColor = baseColor.stroke;
              const passedKey = `${location}_passedChecks`;
              const failedKey = `${location}_failedChecks`;
              
              legendItems.push(
                <div key={`${location}-passed`} className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                     onMouseEnter={() => setHoveredDataKey(passedKey)}
                     onMouseLeave={() => setHoveredDataKey(null)}>
                  <div className="w-3 h-3 rounded-sm border border-green-500" 
                       style={{ backgroundColor: locationColor }} />
                  <span className="text-color-text-default text-xs leading-tight">{location} Passed</span>
                </div>
              );
              
              legendItems.push(
                <div key={`${location}-failed`} className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                     onMouseEnter={() => setHoveredDataKey(failedKey)}
                     onMouseLeave={() => setHoveredDataKey(null)}>
                  <div className="w-3 h-3 rounded-sm border-2 border-red-500" 
                       style={{ backgroundColor: locationColor }} />
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
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-accent-success)' }} />
              <span className="text-color-text-default text-xs leading-tight">Passed Checks</span>
            </div>,
            <div key="failed" className="flex items-center space-x-2 cursor-pointer hover:opacity-80"
                 onMouseEnter={() => setHoveredDataKey('failedChecks')}
                 onMouseLeave={() => setHoveredDataKey(null)}>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-accent-failure)' }} />
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