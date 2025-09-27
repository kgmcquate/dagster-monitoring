import { useParams } from 'react-router-dom';
import { useQuery } from '@apollo/client';
import { GET_ASSET_MATERIALIZATIONS, GET_ASSET_OBSERVATIONS, GET_ASSET_CHECKS } from '../graphql/queries';
import { getRunUrl } from '../utils/dagsterUrls';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { 
  AssetMaterializationsResponse, 
  AssetObservationsResponse, 
  AssetChecksResponse,
  AssetMaterializationsVariables,
  AssetObservationsVariables,
  AssetChecksVariables
} from '../types/graphql';

export default function AssetDetailView() {
  const { assetPath } = useParams<{ assetPath: string }>();
  
  if (!assetPath) {
    return <div>Asset path not found</div>;
  }
  
  const assetKey = { path: decodeURIComponent(assetPath).split('/') };
  
  const { loading: loadingMats, error: errorMats, data: dataMats } = useQuery<
    AssetMaterializationsResponse,
    AssetMaterializationsVariables
  >(
    GET_ASSET_MATERIALIZATIONS,
    { variables: { assetKey } }
  );
  
  const { loading: loadingObs, error: errorObs, data: dataObs } = useQuery<
    AssetObservationsResponse,
    AssetObservationsVariables
  >(
    GET_ASSET_OBSERVATIONS,
    { variables: { assetKey } }
  );
  
  const { loading: loadingChecks, error: errorChecks, data: dataChecks } = useQuery<
    AssetChecksResponse,
    AssetChecksVariables
  >(
    GET_ASSET_CHECKS,
    { variables: { assetKey } }
  );

  if (loadingMats || loadingObs || loadingChecks) return <LoadingSpinner />;
  if (errorMats || errorObs || errorChecks) {
    return <ErrorMessage error={errorMats || errorObs || errorChecks!} />;
  }

  const asset = dataMats?.assetOrError;
  const materializations = asset?.assetMaterializations || [];
  const observations = dataObs?.assetOrError?.assetObservations || [];
  const checks = dataChecks?.assetChecksOrError?.checks || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {assetKey.path.join('.')}
        </h1>
        <p className="mt-2 text-gray-600">Asset details and history</p>
      </div>

      {/* Materializations */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Materializations ({materializations.length})
          </h2>
        </div>
        
        {materializations.length > 0 ? (
          <div className="space-y-4">
            {materializations.slice(0, 10).map((mat, index) => (
              <div key={`${mat.runId}-${index}`} className="border-l-4 border-blue-400 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-default)' }}>
                      Run: <a 
                        href={getRunUrl(mat.runId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors"
                        title={`View run ${mat.runId} in Dagster UI`}
                      >
                        {mat.runId.slice(0, 8)}...
                      </a>
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(parseFloat(mat.timestamp)).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`status-badge ${
                      mat.stepStats?.status === 'SUCCESS' ? 'status-success' : 'status-failure'
                    }`}>
                      {mat.stepStats?.status || 'Unknown'}
                    </span>
                  </div>
                </div>
                {mat.partition && (
                  <p className="text-sm text-gray-600 mt-1">Partition: {mat.partition}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No materializations found</p>
        )}
      </div>

      {/* Observations */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            Recent Observations ({observations.length})
          </h2>
        </div>
        
        {observations.length > 0 ? (
          <div className="space-y-4">
            {observations.slice(0, 10).map((obs, index) => (
              <div key={`${obs.runId}-${index}`} className="border-l-4 border-green-400 pl-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium" style={{ color: 'var(--color-text-default)' }}>
                      Run: <a 
                        href={getRunUrl(obs.runId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 underline hover:no-underline transition-colors"
                        title={`View run ${obs.runId} in Dagster UI`}
                      >
                        {obs.runId.slice(0, 8)}...
                      </a>
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(parseFloat(obs.timestamp)).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`status-badge ${
                      obs.level === 'ERROR' ? 'status-failure' : 'status-success'
                    }`}>
                      {obs.level}
                    </span>
                  </div>
                </div>
                {obs.partition && (
                  <p className="text-sm text-gray-600 mt-1">Partition: {obs.partition}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No observations found</p>
        )}
      </div>

      {/* Asset Checks */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">
            Asset Checks ({checks.length})
          </h2>
        </div>
        
        {checks.length > 0 ? (
          <div className="space-y-4">
            {checks.map((check) => (
              <div key={check.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{check.name}</h3>
                    {check.description && (
                      <p className="text-sm text-gray-600">{check.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`status-badge ${
                      check.executionForLatestMaterialization?.status === 'SUCCESS' 
                        ? 'status-success' 
                        : 'status-failure'
                    }`}>
                      {check.executionForLatestMaterialization?.status || 'Not Run'}
                    </span>
                    {check.blocking && (
                      <div className="mt-1">
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Blocking
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No asset checks configured</p>
        )}
      </div>
    </div>
  );
}