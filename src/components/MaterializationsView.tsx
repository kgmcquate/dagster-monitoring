import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../graphql/queries';
import { Asset } from '../types/dagster';
import { AssetsOverviewResponse } from '../types/graphql';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function MaterializationsView() {
  const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_ASSETS_OVERVIEW, {
    pollInterval: 30000,
  });

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  const assets: Asset[] = data?.assetsOrError?.nodes || [];
  
  // Flatten all materializations
  const allMaterializations = assets.flatMap(asset => 
    asset.assetMaterializations?.map(mat => ({
      ...mat,
      assetPath: asset.key.path.join('.')
    })) || []
  );
  
  // Sort by timestamp descending
  const sortedMaterializations = allMaterializations.sort(
    (a, b) => parseFloat(b.timestamp) - parseFloat(a.timestamp)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-default)' }}>Materializations</h1>
        <p className="mt-2" style={{ color: 'var(--color-text-light)' }}>Recent asset materializations across all assets</p>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Run ID</th>
                <th>Timestamp</th>
                <th>Status</th>
                <th>Partition</th>
              </tr>
            </thead>
            <tbody>
              {sortedMaterializations.slice(0, 100).map((mat, index) => (
                <tr key={`${mat.runId}-${index}`}>
                  <td className="font-medium">
                    {mat.assetPath}
                  </td>
                  <td>
                    <code className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-background-lighter)', color: 'var(--color-text-light)' }}>
                      {mat.runId}
                    </code>
                  </td>
                  <td>
                    {new Date(parseFloat(mat.timestamp)).toLocaleString()}
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
          
          {sortedMaterializations.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: 'var(--color-text-lighter)' }}>No materializations found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}