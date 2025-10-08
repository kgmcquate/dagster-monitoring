import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../../graphql/queries';
import { Asset } from '../../types/dagster';
import { AssetsOverviewResponse } from '../../types/graphql';
import { getRunUrl } from '../../utils/dagsterUrls';
import { LoadingSpinner, ErrorMessage } from '../ui';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

type StatusFilter = 'all' | 'success' | 'failure';

interface FilteredMaterialization {
  runId: string;
  timestamp: string;
  partition?: string;
  stepStats?: {
    status: string;
  };
  assetPath: string;
  codeLocation: string;
}

interface FilterOption {
  value: StatusFilter;
  label: string;
  count?: number;
}

export default function MaterializationsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [codeLocationFilter, setCodeLocationFilter] = useState('all');

  const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_ASSETS_OVERVIEW, {
    pollInterval: 30000,
  });

  const assets: Asset[] = data?.assetsOrError?.nodes || [];
  
  // Flatten all materializations with code location information
  const allMaterializations: FilteredMaterialization[] = assets.flatMap(asset => 
    asset.assetMaterializations?.map(mat => ({
      ...mat,
      assetPath: asset.key.path.join('.'),
      codeLocation: asset.definition?.repository?.location?.name || 'Unknown'
    })) || []
  );
  
  // Get unique code locations for filter dropdown
  const uniqueCodeLocations = useMemo(() => {
    return Array.from(new Set(allMaterializations.map(mat => mat.codeLocation))).sort();
  }, [allMaterializations]);

  // Apply filters and search
  const filteredMaterializations = useMemo(() => {
    let filtered = allMaterializations;

    // Apply status filter
    if (statusFilter === 'success') {
      filtered = filtered.filter(mat => mat.stepStats?.status === 'SUCCESS');
    } else if (statusFilter === 'failure') {
      filtered = filtered.filter(mat => mat.stepStats?.status !== 'SUCCESS');
    }

    // Apply code location filter
    if (codeLocationFilter !== 'all') {
      filtered = filtered.filter(mat => mat.codeLocation === codeLocationFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(mat =>
        mat.assetPath.toLowerCase().includes(lowerSearchTerm) ||
        mat.runId.toLowerCase().includes(lowerSearchTerm) ||
        mat.partition?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Sort by timestamp descending
    return filtered.sort((a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp));
  }, [allMaterializations, statusFilter, codeLocationFilter, searchTerm]);

  // Calculate filter counts and create filter options
  const filterOptions: FilterOption[] = useMemo(() => {
    const successCount = allMaterializations.filter(mat => mat.stepStats?.status === 'SUCCESS').length;
    const failureCount = allMaterializations.filter(mat => mat.stepStats?.status !== 'SUCCESS').length;
    
    return [
      { value: 'all', label: 'All Materializations', count: allMaterializations.length },
      { value: 'success', label: 'Successful', count: successCount },
      { value: 'failure', label: 'Failed', count: failureCount },
    ];
  }, [allMaterializations]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-color-text-default">Materializations</h1>
        <p className="mt-2 text-color-text-lighter">Recent asset materializations across all assets</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-color-background-default border border-color-border rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setStatusFilter(option.value)}
                className={`
                  inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${statusFilter === option.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-color-background-lighter text-color-text-default border border-color-border hover:bg-color-background-hover'
                  }
                `}
              >
                {option.label}
                {option.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    statusFilter === option.value
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-color-background-default text-color-text-lighter'
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            {/* Code Location Filter */}
            <div className="min-w-[200px]">
              <select
                value={codeLocationFilter}
                onChange={(e) => setCodeLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-color-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-color-background-default text-color-text-default"
              >
                <option value="all">All Code Locations</option>
                {uniqueCodeLocations.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative max-w-md w-full lg:w-auto">
              <input
                type="text"
                placeholder="Search by asset, run ID, or partition..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-color-border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-color-background-default text-color-text-default"
              />
              <FunnelIcon className="absolute left-3 top-2.5 h-5 w-5 text-color-text-lighter" />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-2.5 h-5 w-5 text-color-text-lighter hover:text-color-text-default"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {filteredMaterializations.length === 0 ? (
        <div className="bg-color-background-default border border-color-border rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <FunnelIcon className="h-6 w-6 text-color-text-lighter" />
          </div>
          <h3 className="text-lg font-medium text-color-text-default mb-2">
            {allMaterializations.length === 0 ? 'No Materializations Found' : 'No Matching Materializations'}
          </h3>
          <p className="text-color-text-lighter">
            {allMaterializations.length === 0 
              ? 'No materializations have been recorded for your assets.'
              : `No materializations match the current filters ${searchTerm ? `and search "${searchTerm}"` : ''}.`
            }
          </p>
          {(statusFilter !== 'all' || codeLocationFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('all');
                setCodeLocationFilter('all');
                setSearchTerm('');
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-color-border rounded-md shadow-sm text-sm font-medium text-color-text-default bg-color-background-default hover:bg-color-background-hover"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-color-background-default border border-color-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-color-border">
            <h3 className="text-lg font-medium text-color-text-default">
              Materializations ({filteredMaterializations.length})
            </h3>
            <p className="text-sm text-color-text-lighter mt-1">
              {statusFilter !== 'all' && `Filtered by: ${filterOptions.find(o => o.value === statusFilter)?.label}`}
              {codeLocationFilter !== 'all' && ` • Code Location: ${codeLocationFilter}`}
              {searchTerm && ` • Search: "${searchTerm}"`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Code Location</th>
                  <th>Run</th>
                  <th>Timestamp</th>
                  <th>Status</th>
                  <th>Partition</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterializations.slice(0, 100).map((mat: FilteredMaterialization, index: number) => (
                  <tr key={`${mat.runId}-${index}`}>
                    <td className="font-medium">
                      {mat.assetPath}
                    </td>
                    <td>
                      <span className="text-sm text-color-text-lighter">
                        {mat.codeLocation}
                      </span>
                    </td>
                    <td>
                      <a 
                        href={getRunUrl(mat.runId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors text-xs"
                        title={`View run ${mat.runId} in Dagster UI`}
                      >
                        {mat.runId.slice(0, 8)}...
                      </a>
                    </td>
                    <td>
                      <div>
                        <div>{new Date(parseInt(mat.timestamp)).toLocaleDateString()}</div>
                        <div className="text-xs opacity-75">{new Date(parseInt(mat.timestamp)).toLocaleTimeString()}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${
                        mat.stepStats?.status === 'SUCCESS' ? 'status-success' : 'status-failure'
                      }`}>
                        {mat.stepStats?.status || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      {mat.partition || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredMaterializations.length > 100 && (
              <div className="px-6 py-4 border-t border-color-border bg-color-background-lighter">
                <p className="text-sm text-color-text-lighter">
                  Showing first 100 of {filteredMaterializations.length} materializations
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}