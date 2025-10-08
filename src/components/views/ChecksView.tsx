import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ALL_ASSET_CHECKS } from '../../graphql/queries';
import { AllAssetChecksResponse } from '../../types/graphql';
import { Asset, AssetCheck, AssetCheckExecutionStatus } from '../../types/dagster';
import { getRunUrl, getAssetUrl, getAssetCheckUrl } from '../../utils/dagsterUrls';
import { LoadingSpinner, ErrorMessage } from '../ui';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

type StatusFilter = 'all' | 'failed' | 'passed' | 'in-progress' | 'not-executed';
type TypeFilter = 'all' | 'blocking' | 'non-blocking' | 'freshness';

interface StatusFilterOption {
  value: StatusFilter;
  label: string;
  count?: number;
}

interface TypeFilterOption {
  value: TypeFilter;
  label: string;
  count?: number;
}

export default function ChecksView() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('failed');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
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

  // Filter checks based on status filter, type filter, and search term
  const filteredChecks = useMemo(() => {
    let filtered = allAssetChecks;

    // Apply status filter
    if (statusFilter === 'failed') {
      filtered = filtered.filter(check =>
        check.executionForLatestMaterialization?.evaluation?.success === false ||
        check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.FAILURE
      );
    } else if (statusFilter === 'passed') {
      filtered = filtered.filter(check =>
        check.executionForLatestMaterialization?.evaluation?.success === true ||
        check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.SUCCESS
      );
    } else if (statusFilter === 'in-progress') {
      filtered = filtered.filter(check =>
        check.executionForLatestMaterialization?.status === AssetCheckExecutionStatus.IN_PROGRESS
      );
    } else if (statusFilter === 'not-executed') {
      filtered = filtered.filter(check =>
        !check.executionForLatestMaterialization?.status
      );
    }

    // Apply type filter
    if (typeFilter === 'blocking') {
      filtered = filtered.filter(check => check.blocking);
    } else if (typeFilter === 'non-blocking') {
      filtered = filtered.filter(check => !check.blocking);
    } else if (typeFilter === 'freshness') {
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
  }, [allAssetChecks, statusFilter, typeFilter, searchTerm]);

  // Calculate status filter counts
  const statusFilterOptions: StatusFilterOption[] = useMemo(() => {
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

    return [
      { value: 'all', label: 'All Statuses', count: allAssetChecks.length },
      { value: 'failed', label: 'Failed', count: failedCount },
      { value: 'passed', label: 'Passed', count: passedCount },
      { value: 'in-progress', label: 'In Progress', count: inProgressCount },
      { value: 'not-executed', label: 'Not Executed', count: notExecutedCount },
    ];
  }, [allAssetChecks]);

  // Calculate type filter counts
  const typeFilterOptions: TypeFilterOption[] = useMemo(() => {
    const blockingCount = allAssetChecks.filter(check => check.blocking).length;
    const nonBlockingCount = allAssetChecks.filter(check => !check.blocking).length;
    const freshnessCount = allAssetChecks.filter(check => check.name.includes('_freshness_check')).length;

    return [
      { value: 'all', label: 'All Types', count: allAssetChecks.length },
      { value: 'blocking', label: 'Blocking', count: blockingCount },
      { value: 'non-blocking', label: 'Non-blocking', count: nonBlockingCount },
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
        <div className="flex flex-col gap-4">
          {/* Status Filter Buttons */}
          <div>
            <label className="text-sm font-medium text-color-text-default mb-2 block">Status</label>
            <div className="flex flex-wrap gap-2">
              {statusFilterOptions.map((option) => (
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
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${statusFilter === option.value
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-color-background-default text-color-text-lighter'
                      }`}>
                      {option.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Type Filter Buttons */}
          <div>
            <label className="text-sm font-medium text-color-text-default mb-2 block">Type</label>
            <div className="flex flex-wrap gap-2">
              {typeFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTypeFilter(option.value)}
                  className={`
                    inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${typeFilter === option.value
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-color-background-lighter text-color-text-default border border-color-border hover:bg-color-background-hover'
                    }
                  `}
                >
                  {option.label}
                  {option.count !== undefined && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${typeFilter === option.value
                      ? 'bg-green-200 text-green-800'
                      : 'bg-color-background-default text-color-text-lighter'
                      }`}>
                      {option.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
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
              : `No checks match the current filters ${searchTerm ? `and search "${searchTerm}"` : ''}.`
            }
          </p>
          {(statusFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter('failed');
                setTypeFilter('all');
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
              Asset Checks ({filteredChecks.length})
            </h3>
            <p className="text-sm text-color-text-lighter mt-1">
              {statusFilter !== 'all' && `Status: ${statusFilterOptions.find(o => o.value === statusFilter)?.label}`}
              {typeFilter !== 'all' && `${statusFilter !== 'all' ? ' • ' : ''}Type: ${typeFilterOptions.find(o => o.value === typeFilter)?.label}`}
              {searchTerm && `${statusFilter !== 'all' || typeFilter !== 'all' ? ' • ' : ''}Search: "${searchTerm}"`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Type</th>
                  <th>Check Name</th>
                  <th>Asset</th>
                  <th>Jobs</th>
                  <th>Last Executed</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filteredChecks.map((check, index) => {
                  const execution = check.executionForLatestMaterialization;

                  return (
                    <tr key={index}>
                      <td>
                        <span className={`status-badge ${execution?.evaluation?.success === false || execution?.status === 'FAILURE' ? 'status-failure' :
                          execution?.evaluation?.success === true || execution?.status === 'SUCCESS' ? 'status-success' :
                            execution?.status === 'IN_PROGRESS' ? 'status-stale' : 'status-missing'
                          }`}>
                          {getStatusLabel(check)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${check.blocking ? 'status-failure' : 'status-success'
                          }`}>
                          {check.blocking ? 'Blocking' : 'Non-blocking'}
                        </span>
                      </td>
                      <td className="font-medium">
                        <div className="flex items-center space-x-2">
                          <a
                            href={getAssetCheckUrl(check.assetKey?.path || [], check.name)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors"
                            title={`View check ${check.name} in Dagster UI`}
                          >
                            {check.name}
                          </a>
                        </div>
                      </td>
                      <td>
                        <a
                          href={getAssetUrl(check.assetKey?.path || [])}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors"
                          title={`View asset ${check.assetPath} in Dagster UI`}
                        >
                          {check.assetPath}
                        </a>
                      </td>
                      <td>
                        {check.jobNames && check.jobNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {check.jobNames.map((jobName, jobIndex) => (
                              <span
                                key={jobIndex}
                                className="status-badge status-success"
                              >
                                {jobName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span>N/A</span>
                        )}
                      </td>
                      <td>
                        {execution?.timestamp ? (
                          <div>
                            <div>{new Date(parseInt(execution.timestamp)).toLocaleDateString()}</div>
                            <div className="text-xs opacity-75">{new Date(parseInt(execution.timestamp)).toLocaleTimeString()}</div>
                          </div>
                        ) : (
                          <span>Never</span>
                        )}
                      </td>
                      <td className="max-w-xs">
                        <div className="truncate" title={execution?.evaluation?.description || check.description || 'No description'}>
                          {execution?.evaluation?.description || check.description || (
                            <span className="italic opacity-75">No description</span>
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