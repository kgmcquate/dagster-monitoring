import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../graphql/queries';
import { Asset } from '../types/dagster';
import { AssetsOverviewResponse } from '../types/graphql';
import { getRunUrl } from '../utils/dagsterUrls';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function ObservationsView() {
  const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_ASSETS_OVERVIEW, {
    pollInterval: 30000,
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const assets: Asset[] = data?.assetsOrError?.nodes || [];
  
  // Flatten all observations
  const allObservations = assets.flatMap(asset => 
    asset.assetObservations?.map(obs => ({
      ...obs,
      assetPath: asset.key.path.join('.')
    })) || []
  );
  
  // Sort by timestamp descending
  const sortedObservations = allObservations.sort(
    (a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-default)' }}>Observations</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-light)' }}>Recent asset observations and quality metrics</p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-border)' }}>
            <thead style={{ backgroundColor: 'var(--color-background-light)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-lighter)' }}>
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-lighter)' }}>
                  Run
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-lighter)' }}>
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-lighter)' }}>
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-lighter)' }}>
                  Partition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-text-lighter)' }}>
                  Metadata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ backgroundColor: 'var(--color-background-default)', borderColor: 'var(--color-border)' }}>
              {sortedObservations.slice(0, 100).map((obs, index) => (
                <tr key={`${obs.runId}-${index}`} className="hover:bg-color-background-light transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" style={{ color: 'var(--color-text-default)' }}>
                    {obs.assetPath}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <a 
                      href={getRunUrl(obs.runId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors"
                      title={`View run ${obs.runId} in Dagster UI`}
                    >
                      {obs.runId.slice(0, 8)}...
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-lighter)' }}>
                    {new Date(parseFloat(obs.timestamp)).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`status-badge ${
                      obs.level === 'ERROR' ? 'status-failure' : 
                      obs.level === 'WARNING' ? 'status-stale' : 'status-success'
                    }`}>
                      {obs.level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-lighter)' }}>
                    {obs.partition || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" style={{ color: 'var(--color-text-lighter)' }}>
                    {obs.metadataEntries?.length || 0} entries
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedObservations.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-lighter)' }}>No observations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}