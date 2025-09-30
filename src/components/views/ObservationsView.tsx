import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../../graphql/queries';
import { Asset } from '../../types/dagster';
import { AssetsOverviewResponse } from '../../types/graphql';
import { getRunUrl } from '../../utils/dagsterUrls';
import { LoadingSpinner, ErrorMessage } from '../ui';

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
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Run</th>
                <th>Timestamp</th>
                <th>Level</th>
                <th>Partition</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody>
              {sortedObservations.slice(0, 100).map((obs, index) => (
                <tr key={`${obs.runId}-${index}`}>
                  <td className="font-medium">
                    {obs.assetPath}
                  </td>
                  <td>
                    <a 
                      href={getRunUrl(obs.runId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors text-xs"
                      title={`View run ${obs.runId} in Dagster UI`}
                    >
                      {obs.runId.slice(0, 8)}...
                    </a>
                  </td>
                  <td>
                    {new Date(parseFloat(obs.timestamp)).toLocaleString()}
                  </td>
                  <td>
                    <span className={`status-badge ${
                      obs.level === 'ERROR' ? 'status-failure' : 
                      obs.level === 'WARNING' ? 'status-stale' : 'status-success'
                    }`}>
                      {obs.level}
                    </span>
                  </td>
                  <td>
                    {obs.partition || '-'}
                  </td>
                  <td>
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