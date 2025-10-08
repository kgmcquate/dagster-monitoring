import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../../graphql/queries';
import { Asset } from '../../types/dagster';
import { AssetsOverviewResponse } from '../../types/graphql';
import { getRunUrl, getAssetUrl } from '../../utils/dagsterUrls';
import { LoadingSpinner, ErrorMessage } from '../ui';
import { EyeIcon } from '@heroicons/react/24/outline';

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
      assetPath: asset.key.path.join('.'),
      assetKeyPath: asset.key.path
    })) || []
  );
  
  // Sort by timestamp descending
  const sortedObservations = allObservations.sort(
    (a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-color-text-default">Observations</h1>
        <p className="mt-2 text-color-text-lighter">Recent asset observations and quality metrics</p>
        {allObservations.length === 0 && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>No Observations Found:</strong> Observations are automatically generated when assets are materialized or when custom observation functions are run.
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {sortedObservations.length === 0 ? (
        <div className="bg-color-background-default border border-color-border rounded-lg p-8 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <EyeIcon className="h-6 w-6 text-color-text-lighter" />
          </div>
          <h3 className="text-lg font-medium text-color-text-default mb-2">
            No Observations Found
          </h3>
          <p className="text-color-text-lighter">
            No asset observations have been recorded yet. Observations will appear here when assets are materialized.
          </p>
        </div>
      ) : (
        <div className="bg-color-background-default border border-color-border rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-color-border">
            <h3 className="text-lg font-medium text-color-text-default">
              Observations ({sortedObservations.length})
            </h3>
            <p className="text-sm text-color-text-lighter mt-1">
              Showing {Math.min(sortedObservations.length, 100)} most recent observations
            </p>
          </div>

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
                      <a
                        href={getAssetUrl(obs.assetKeyPath || [])}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors"
                        title={`View asset ${obs.assetPath} in Dagster UI`}
                      >
                        {obs.assetPath}
                      </a>
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
                      <div>
                        <div>{new Date(parseFloat(obs.timestamp)).toLocaleDateString()}</div>
                        <div className="text-xs opacity-75">{new Date(parseFloat(obs.timestamp)).toLocaleTimeString()}</div>
                      </div>
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
          </div>
        </div>
      )}
    </div>
  );
}