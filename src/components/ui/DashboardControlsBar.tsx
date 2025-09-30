import React from 'react';
import { Asset } from '../../types/dagster';

interface DashboardControlsBarProps {
    dateRange: string;
    onDateRangeChange: (range: string) => void;
    groupByCodeLocation: boolean;
    onGroupByCodeLocationChange: (grouped: boolean) => void;
}

export default function DashboardControlsBar({
    dateRange,
    onDateRangeChange,
    groupByCodeLocation,
    onGroupByCodeLocationChange
}: DashboardControlsBarProps) {
    return (
        <div className="fixed bottom-0 right-0 z-40 py-3 px-8 mt-6" style={{
            left: 'var(--sidebar-width, 16rem)', // Account for dynamic sidebar width
            backgroundColor: 'var(--color-background-default)',
            borderTop: '1px solid var(--color-border-default)',
            backdropFilter: 'blur(8px)',
            transition: 'left 0.3s ease'
        }}>
            <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-6">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={groupByCodeLocation}
                            onChange={(e) => onGroupByCodeLocationChange(e.target.checked)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-default)' }}>
                            Group by Code Location
                        </span>
                    </label>
                </div>
                <div className="flex items-center gap-6">
                    {/* Horizontal Date Range Filter */}
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium" style={{ color: 'var(--color-text-light)' }}>
                            Time Range:
                        </label>
                        <select
                            value={dateRange}
                            onChange={(e) => onDateRangeChange(e.target.value)}
                            className="input-field text-sm py-1 px-2"
                        >
                            <option value="1d">24h</option>
                            <option value="3d">3d</option>
                            <option value="7d">7d</option>
                            <option value="30d">30d</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}