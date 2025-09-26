import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../graphql/queries';
import { Asset } from '../types/dagster';
import { AssetsOverviewResponse } from '../types/graphql';
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
        <h1 className="text-3xl font-bold text-gray-900">Observations</h1>
        <p className="mt-2 text-gray-600">Recent asset observations and quality metrics</p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Asset
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Run ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Partition
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Metadata
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedObservations.slice(0, 100).map((obs, index) => (
                <tr key={`${obs.runId}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {obs.assetPath}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {obs.runId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {obs.partition || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {obs.metadataEntries?.length || 0} entries
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedObservations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No observations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}