import React from 'react';
import { Asset } from '../../types/dagster';

interface DashboardFiltersProps {
  assets: Asset[];
  selectedGroups: string[];
  onGroupsChange: (groups: string[]) => void;
  dateRange: string;
  onDateRangeChange: (range: string) => void;
}

export default function DashboardFilters({ 
  assets, 
  selectedGroups, 
  onGroupsChange, 
  dateRange, 
  onDateRangeChange 
}: DashboardFiltersProps) {
  
  // Get unique groups/code locations
  const uniqueGroups = Array.from(new Set(
    assets.map(asset => asset.definition?.groupName || 'Unknown').filter(Boolean)
  )).sort();

  const handleGroupToggle = (group: string) => {
    if (selectedGroups.includes(group)) {
      onGroupsChange(selectedGroups.filter(g => g !== group));
    } else {
      onGroupsChange([...selectedGroups, group]);
    }
  };

  const handleSelectAllGroups = () => {
    if (selectedGroups.length === uniqueGroups.length) {
      onGroupsChange([]);
    } else {
      onGroupsChange(uniqueGroups);
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 style={{ color: 'var(--color-text-default)' }}>Filters & Controls</h3>
      </div>
      
      <div className="space-y-6">
        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-light)' }}>
            Time Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="input-field w-full"
          >
            <option value="1d">Last 24 Hours</option>
            <option value="3d">Last 3 Days</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>

        {/* Group/Code Location Filter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text-light)' }}>
              Asset Groups ({selectedGroups.length} of {uniqueGroups.length} selected)
            </label>
            <button
              onClick={handleSelectAllGroups}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ 
                color: 'var(--color-accent-blue)',
                backgroundColor: 'rgba(79, 67, 221, 0.1)',
                border: '1px solid rgba(79, 67, 221, 0.3)'
              }}
            >
              {selectedGroups.length === uniqueGroups.length ? 'Clear All' : 'Select All'}
            </button>
          </div>
          
          <div className="max-h-48 overflow-y-auto space-y-2 border rounded-lg p-2" style={{ borderColor: 'var(--color-border-default)' }}>
            {uniqueGroups.map(group => (
              <label key={group} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGroups.includes(group)}
                  onChange={() => handleGroupToggle(group)}
                  className="rounded"
                  style={{ accentColor: 'var(--color-accent-blue)' }}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-default)' }}>
                  {group}
                </span>
                <span 
                  className="text-xs px-2 py-0.5 rounded-full ml-auto"
                  style={{ 
                    backgroundColor: 'var(--color-background-lighter)', 
                    color: 'var(--color-text-lighter)' 
                  }}
                >
                  {assets.filter(asset => (asset.definition?.groupName || 'Unknown') === group).length}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="pt-4 border-t" style={{ borderColor: 'var(--color-border-default)' }}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div style={{ color: 'var(--color-text-lighter)' }}>Filtered Assets</div>
              <div className="font-medium" style={{ color: 'var(--color-text-default)' }}>
                {assets.filter(asset => 
                  selectedGroups.length === 0 || 
                  selectedGroups.includes(asset.definition?.groupName || 'Unknown')
                ).length}
              </div>
            </div>
            <div>
              <div style={{ color: 'var(--color-text-lighter)' }}>Total Groups</div>
              <div className="font-medium" style={{ color: 'var(--color-text-default)' }}>
                {uniqueGroups.length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}