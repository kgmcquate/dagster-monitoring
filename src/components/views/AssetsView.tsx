import { useState } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../../graphql/queries';
import { Asset, AssetHealthStatus } from '../../types/dagster';
import { AssetsOverviewResponse } from '../../types/graphql';
import { LoadingSpinner, ErrorMessage } from '../ui';
import { getAssetUrl } from '../../utils/dagsterUrls';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

function getStatusBadgeClass(status: AssetHealthStatus): string {
  switch (status) {
    case AssetHealthStatus.FRESH:
      return 'status-badge status-fresh';
    case AssetHealthStatus.STALE:
      return 'status-badge status-stale';
    case AssetHealthStatus.MISSING:
      return 'status-badge status-missing';
    default:
      return 'status-badge';
  }
}

function getAssetStatus(asset: Asset): AssetHealthStatus {
  // If no materializations, consider it missing
  if (!asset.assetMaterializations || asset.assetMaterializations.length === 0) {
    return AssetHealthStatus.MISSING;
  }

  const lastMaterialization = asset.assetMaterializations[0];
  // Timestamp is already in milliseconds
  const timestamp = parseFloat(lastMaterialization.timestamp);
  const lastMaterializationTime = new Date(timestamp);
  const now = new Date();
  const hoursSinceLastMaterialization = (now.getTime() - lastMaterializationTime.getTime()) / (1000 * 60 * 60);

  // Consider fresh if materialized within last 24 hours, stale if older
  if (hoursSinceLastMaterialization < 24) {
    return AssetHealthStatus.FRESH;
  } else {
    return AssetHealthStatus.STALE;
  }
}

export default function AssetsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetHealthStatus | 'all'>('all');
  
  const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_ASSETS_OVERVIEW, {
    pollInterval: 30000,
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const assets: Asset[] = data?.assetsOrError?.nodes || [];
  
  // Filter assets based on search and status
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.key.path.join('.').toLowerCase().includes(searchTerm.toLowerCase());
    const assetStatus = getAssetStatus(asset);
    const matchesStatus = statusFilter === 'all' || assetStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-default)' }}>Assets</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-light)' }}>Monitor and manage your Dagster assets</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="input-field block w-full pl-10 pr-3 py-2 leading-5"
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="sm:w-48">
          <select
            className="input-field block w-full py-2 px-3"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AssetHealthStatus | 'all')}
          >
            <option value="all">All Status</option>
            <option value={AssetHealthStatus.FRESH}>Fresh</option>
            <option value={AssetHealthStatus.STALE}>Stale</option>
            <option value={AssetHealthStatus.MISSING}>Missing</option>
          </select>
        </div>
      </div>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {filteredAssets.map((asset) => {
          const lastMaterialization = asset.assetMaterializations?.[0];
          
          const handleAssetClick = () => {
            const assetUrl = getAssetUrl(asset.key.path);
            window.open(assetUrl, '_blank');
          };
          
          return (
            <div
              key={asset.id}
              onClick={handleAssetClick}
              className="card transition-all duration-200 cursor-pointer hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium truncate" style={{ color: 'var(--color-text-default)' }}>
                    {asset.key.path.join('.')}
                  </h3>
                  {asset.definition?.description && (
                    <p className="mt-1 text-sm line-clamp-2" style={{ color: 'var(--color-text-lighter)' }}>
                      {asset.definition.description}
                    </p>
                  )}
                </div>
                
                <div className="ml-4 flex-shrink-0">
                  {(() => {
                    const status = getAssetStatus(asset);
                    return (
                      <span className={getStatusBadgeClass(status)}>
                        {status}
                      </span>
                    );
                  })()}
                </div>
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm" style={{ color: 'var(--color-text-lighter)' }}>
                <div>
                  {asset.definition?.groupName && (
                    <span 
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ 
                        backgroundColor: 'var(--color-background-lighter)', 
                        color: 'var(--color-text-light)',
                        border: '1px solid var(--color-border-default)'
                      }}
                    >
                      {asset.definition.groupName}
                    </span>
                  )}
                </div>
                
                <div>
                  {lastMaterialization ? (
                    <span>Last: {new Date(parseFloat(lastMaterialization.timestamp)).toLocaleDateString()}</span>
                  ) : (
                    <span>Never materialized</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <p style={{ color: 'var(--color-text-lighter)' }}>No assets match your current filters.</p>
        </div>
      )}
    </div>
  );
}