import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_ASSET_CHECKS } from '../../graphql/queries';
import { AllAssetChecksResponse } from '../../types/graphql';
import { Asset, AssetCheck, AssetCheckExecutionStatus } from '../../types/dagster';
import { LoadingSpinner, ErrorMessage } from '../ui';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

type CheckFilter = 'all' | 'failed' | 'passed' | 'in-progress' | 'not-executed' | 'blocking' | 'freshness';

interface FilterOption {
  value: CheckFilter;
  label: string;
  count?: number;
}

export default function ChecksView() {
  const [activeFilter, setActiveFilter] = useState<CheckFilter>('failed');
  const [searchTerm, setSearchTerm] = useState('');

  const { loading, error, data } = useQuery<AllAssetChecksResponse>(GET_ALL_ASSET_CHECKS, {
    pollInterval: 30000,
  });

  // Extract real asset checks from assets
  const allAssetChecks = useMemo(() => {
    console.log('Asset checks query data:', data);
    
    if (!data?.assetNodes) {
      console.log('No assetNodes found in data');
      return [];
    }
    
    console.log('Found assetNodes:', data.assetNodes.length);
    
    const checks: (AssetCheck & { assetPath: string })[] = [];
    
    // Extract asset checks from each asset node
    data.assetNodes.forEach((assetNode: any, index: number) => {
      console.log(`Asset node ${index}:`, assetNode);
      if (assetNode.assetChecksOrError?.checks) {
        console.log(`Found ${assetNode.assetChecksOrError.checks.length} checks for asset node ${index}`);
        assetNode.assetChecksOrError.checks.forEach((check: AssetCheck) => {
          // Extract asset path from the check's assetKey
          const assetPath = check.assetKey?.path?.join('/') || 'Unknown Asset';
          console.log('Processing check:', check.name, 'for asset:', assetPath);
          
          checks.push({
            ...check,
            assetPath: assetPath
          });
        });
      } else {
        console.log(`No checks found for asset node ${index}:`, assetNode.assetChecksOrError);
      }
    });
    
    console.log('Total asset checks found:', checks.length);
    console.log('All checks:', checks);
    
    return checks;
  }, [data]);

  // Filter checks based on active filter and search term
  const filteredChecks = useMemo(() => {
    let filtered = allAssetChecks;

    // Apply status filter
    if (activeFilter === 'failed') {
      filtered = filtered.filter(check => 
        check.executionForLatestMaterialization?.evaluation?.success === false ||
        check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.FAILURE
      );
    } else if (activeFilter === 'passed') {
      filtered = filtered.filter(check => 
        check.executionForLatestMaterialization?.evaluation?.success === true ||
        check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.SUCCESS
      );
    } else if (activeFilter === 'in-progress') {
      filtered = filtered.filter(check => 
        check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.IN_PROGRESS
      );
    } else if (activeFilter === 'not-executed') {
      filtered = filtered.filter(check => 
        !check.executionForLatestMaterialization?.status
      );
    } else if (activeFilter === 'blocking') {
      filtered = filtered.filter(check => check.blocking);
    } else if (activeFilter === 'freshness') {
      filtered = filtered.filter(check => check.name.includes('_freshness_check'));
    }

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(check =>
        check.name.toLowerCase().includes(lowerSearchTerm) ||
        check.assetPath?.toLowerCase().includes(lowerSearchTerm) ||
        check.description?.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return filtered;
  }, [allAssetChecks, activeFilter, searchTerm]);

  // Calculate filter counts
  const filterOptions: FilterOption[] = useMemo(() => {
    const failedCount = allAssetChecks.filter(check => 
      check.executionForLatestMaterialization?.evaluation?.success === false ||
      check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.FAILURE
    ).length;
    
    const passedCount = allAssetChecks.filter(check => 
      check.executionForLatestMaterialization?.evaluation?.success === true ||
      check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.SUCCESS
    ).length;
    
    const inProgressCount = allAssetChecks.filter(check => 
      check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.IN_PROGRESS
    ).length;
    
    const notExecutedCount = allAssetChecks.filter(check => 
      !check.executionForLatestMaterialization?.status
    ).length;
    
    const blockingCount = allAssetChecks.filter(check => check.blocking).length;
    const freshnessCount = allAssetChecks.filter(check => check.name.includes('_freshness_check')).length;

    return [
      { value: 'all', label: 'All Checks', count: allAssetChecks.length },
      { value: 'failed', label: 'Failed', count: failedCount },
      { value: 'passed', label: 'Passed', count: passedCount },
      { value: 'in-progress', label: 'In Progress', count: inProgressCount },
      { value: 'not-executed', label: 'Not Executed', count: notExecutedCount },
      { value: 'blocking', label: 'Blocking', count: blockingCount },
      { value: 'freshness', label: 'Freshness Checks', count: freshnessCount },
    ];
  }, [allAssetChecks]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const getStatusColor = (check: AssetCheck & { assetPath: string }) => {
    const execution = check.executionForLatestMaterialization;
    const success = execution?.evaluation?.success;
    const status = execution?.status;
    
    if (success === false || status === AssetCheckExecutionStatus.FAILURE) {
      return 'text-red-600 bg-red-50 border-red-200';
    } else if (success === true || status === AssetCheckExecutionStatus.SUCCESS) {
      return 'text-green-600 bg-green-50 border-green-200';
    } else if (status === AssetCheckExecutionStatus.IN_PROGRESS) {
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    } else {
      return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (check: AssetCheck & { assetPath: string }) => {
    const execution = check.executionForLatestMaterialization;
    const success = execution?.evaluation?.success;
    const status = execution?.status;
    
    if (success === false || status === AssetCheckExecutionStatus.FAILURE) {
      return 'Failed';
    } else if (success === true || status === AssetCheckExecutionStatus.SUCCESS) {
      return 'Passed';
    } else if (status === AssetCheckExecutionStatus.IN_PROGRESS) {
      return 'In Progress';
    } else {
      return 'Not Executed';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-color-text-default">Asset Checks</h1>
        <p className="mt-2 text-color-text-lighter">Asset validation checks and their results</p>
        {allAssetChecks.length === 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>No Asset Checks Found:</strong> Configure asset checks using <code className="bg-blue-100 px-1 py-0.5 rounded">@asset_check</code> decorators 
              in your Dagster assets to enable validation and monitoring.
            </p>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-color-background-default border border-color-border rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                className={`
                  inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${activeFilter === option.value
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-color-background-lighter text-color-text-default border border-color-border hover:bg-color-background-hover'
                  }
                `}
              >
                {option.label}
                {option.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeFilter === option.value
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-color-background-default text-color-text-lighter'
                  }`}>
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-md w-full lg:w-auto">
            <input
              type="text"
              placeholder="Search checks by name, asset, or description..."
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

      {/* Results */}
      {filteredChecks.length === 0 ? (
        <div className="bg-color-background-default border border-color-border rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <FunnelIcon className="h-6 w-6 text-color-text-lighter" />
          </div>
          <h3 className="text-lg font-medium text-color-text-default mb-2">
            {allAssetChecks.length === 0 ? 'No Asset Checks Found' : 'No Matching Checks'}
          </h3>
          <p className="text-color-text-lighter">
            {allAssetChecks.length === 0 
              ? 'No asset checks have been configured for your assets.'
              : `No checks match the current filter "${activeFilter}" ${searchTerm ? `and search "${searchTerm}"` : ''}.`
            }
          </p>
          {(activeFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setActiveFilter('failed');
                setSearchTerm('');
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-color-border rounded-md shadow-sm text-sm font-medium text-color-text-default bg-color-background-default hover:bg-color-background-hover"
            >
              Reset to Failed Checks
            </button>
          )}
        </div>
      ) : (
        <div className="bg-color-background-default border border-color-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-color-border">
            <h3 className="text-lg font-medium text-color-text-default">
              Asset Checks ({filteredChecks.length})
            </h3>
            <p className="text-sm text-color-text-lighter mt-1">
              {activeFilter !== 'all' && `Filtered by: ${filterOptions.find(o => o.value === activeFilter)?.label}`}
              {searchTerm && ` • Search: "${searchTerm}"`}
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-color-border">
              <thead className="bg-color-background-lighter">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                    Check Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                    Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                    Last Executed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-color-text-lighter uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-color-background-default divide-y divide-color-border">
                {filteredChecks.map((check, index) => {
                  const execution = check.executionForLatestMaterialization;
                  const severity = execution?.evaluation?.severity;
                  
                  return (
                    <tr key={index} className="hover:bg-color-background-lighter">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-color-text-default">
                        <div className="flex items-center space-x-2">
                          <span>{check.name}</span>
                          {severity && (
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                              severity === 'ERROR' ? 'bg-red-100 text-red-800' :
                              severity === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {severity}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-color-text-default">
                        <code className="text-xs bg-color-background-lighter px-2 py-1 rounded">
                          {check.assetPath}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(check)}`}
                        >
                          {getStatusLabel(check)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-color-text-default">
                        {check.blocking ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                            Blocking
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            Non-blocking
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-color-text-default">
                        {check.jobNames && check.jobNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {check.jobNames.map((jobName, jobIndex) => (
                              <span 
                                key={jobIndex}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                              >
                                {jobName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-color-text-lighter">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-color-text-default">
                        {execution?.timestamp ? (
                          <div className="text-xs">
                            <div>{new Date(parseInt(execution.timestamp) * 1000).toLocaleDateString()}</div>
                            <div className="text-color-text-lighter">{new Date(parseInt(execution.timestamp) * 1000).toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          <span className="text-color-text-lighter">Never</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-color-text-default max-w-xs">
                        <div className="truncate" title={execution?.evaluation?.description || check.description || 'No description'}>
                          {execution?.evaluation?.description || check.description || (
                            <span className="text-color-text-lighter italic">No description</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}