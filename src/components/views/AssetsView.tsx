import { useState, useMemo, useCallback, memo, useEffect } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../../graphql/queries';
import { Asset, AssetHealthStatus } from '../../types/dagster';
import { AssetsOverviewResponse } from '../../types/graphql';
import { LoadingSpinner, ErrorMessage, LazyChart, PerformanceStats } from '../ui';
import { useDebounce } from '../../hooks';
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

// Memoized AssetCard component to prevent unnecessary re-renders
const AssetCard = memo(({ asset }: { asset: Asset }) => {
  const lastMaterialization = asset.assetMaterializations?.[0];
  
  const handleAssetClick = useCallback(() => {
    const assetUrl = getAssetUrl(asset.key.path);
    window.open(assetUrl, '_blank');
  }, [asset.key.path]);
  
  const assetStatus = useMemo(() => getAssetStatus(asset), [asset]);
  
  return (
    <div
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
          <span className={getStatusBadgeClass(assetStatus)}>
            {assetStatus}
          </span>
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
});

// Simple AssetGrid component without hooks to avoid conditional hook issues
const AssetGrid = memo(({ 
  assets, 
  onLoadMore, 
  visibleCount, 
  totalCount 
}: { 
  assets: Asset[]; 
  onLoadMore: () => void;
  visibleCount: number;
  totalCount: number;
}) => {
  return (
    <>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {assets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
      </div>
      
      {visibleCount < totalCount && (
        <div className="text-center mt-8">
          <button
            onClick={onLoadMore}
            className="btn-primary px-6 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'white',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Load More ({totalCount - visibleCount} remaining)
          </button>
        </div>
      )}
    </>
  );
});

// Add display name for debugging
AssetGrid.displayName = 'AssetGrid';

export default function AssetsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<AssetHealthStatus | 'all'>('all');
  
  const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_ASSETS_OVERVIEW, {
    pollInterval: 30000,
  });

  // Debounce search term to improve performance
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // Memoize search term processing to avoid re-creating the lowercase version
  const normalizedSearchTerm = useMemo(() => 
    debouncedSearchTerm.toLowerCase().trim(), 
    [debouncedSearchTerm]
  );

  // Process assets safely, even during loading/error states
  const assets: Asset[] = useMemo(() => 
    data?.assetsOrError?.nodes || [], 
    [data]
  );
  
  // Memoize expensive filtering operations
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = normalizedSearchTerm === '' || 
        asset.key.path.join('.').toLowerCase().includes(normalizedSearchTerm);
      
      if (!matchesSearch) return false;
      
      if (statusFilter === 'all') return true;
      
      const assetStatus = getAssetStatus(asset);
      return assetStatus === statusFilter;
    });
  }, [assets, normalizedSearchTerm, statusFilter]);

  // Memoize status counts for potential future use
  const statusCounts = useMemo(() => {
    const counts = { 
      all: filteredAssets.length,
      [AssetHealthStatus.FRESH]: 0,
      [AssetHealthStatus.STALE]: 0,
      [AssetHealthStatus.MISSING]: 0
    };
    
    filteredAssets.forEach(asset => {
      const status = getAssetStatus(asset);
      counts[status]++;
    });
    
    return counts;
  }, [filteredAssets]);

  // Add pagination state to main component to avoid conditional hooks
  const [visibleCount, setVisibleCount] = useState(12);
  
  // Memoized event handlers to prevent unnecessary re-renders
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const handleStatusFilterChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value as AssetHealthStatus | 'all');
  }, []);

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + 12);
  }, []);

  // Memoize visible assets
  const visibleAssets = useMemo(() => 
    filteredAssets.slice(0, Math.min(visibleCount, filteredAssets.length)), 
    [filteredAssets, visibleCount]
  );

  // Effect to reset pagination when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [normalizedSearchTerm, statusFilter]);

  // Handle loading and error states after all hooks are called
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

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
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="sm:w-48">
          <select
            className="input-field block w-full py-2 px-3"
            value={statusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="all">All Status ({statusCounts.all})</option>
            <option value={AssetHealthStatus.FRESH}>Fresh ({statusCounts[AssetHealthStatus.FRESH]})</option>
            <option value={AssetHealthStatus.STALE}>Stale ({statusCounts[AssetHealthStatus.STALE]})</option>
            <option value={AssetHealthStatus.MISSING}>Missing ({statusCounts[AssetHealthStatus.MISSING]})</option>
          </select>
        </div>
      </div>

      {/* Assets Grid with Lazy Loading */}
      {filteredAssets.length > 0 ? (
        <LazyChart fallbackMessage="Loading assets..." height={200}>
          <AssetGrid 
            assets={visibleAssets} 
            onLoadMore={handleLoadMore}
            visibleCount={visibleCount}
            totalCount={filteredAssets.length}
          />
        </LazyChart>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-color-text-default mb-2">No assets found</h3>
          <p style={{ color: 'var(--color-text-lighter)' }}>
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search terms or filters.' 
              : 'No assets are available in this workspace.'}
          </p>
        </div>
      )}
      
      {/* Development Performance Monitoring */}
      <PerformanceStats componentName="AssetsView" />
    </div>
  );
}