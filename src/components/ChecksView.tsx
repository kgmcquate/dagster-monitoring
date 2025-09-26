import { useQuery } from '@apollo/client';
import { GET_ASSETS_OVERVIEW } from '../graphql/queries';
import { AssetsOverviewResponse } from '../types/graphql';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function ChecksView() {
//   const { loading, error, data } = useQuery<AssetsOverviewResponse>(GET_ASSETS_OVERVIEW, {
//     pollInterval: 30000,
//   });

//   if (loading) return <LoadingSpinner />;
//   if (error) return <ErrorMessage error={error} />;

  // Note: Asset checks would need additional queries to get detailed information
  // This is a placeholder implementation showing the structure
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Asset Checks</h1>
        <p className="mt-2 text-gray-600">Asset validation checks and their results</p>
      </div>

      <div className="card">
        <div className="text-center py-12">
          <p className="text-gray-500">
            Asset checks view is under development. 
            Check individual assets for their specific checks.
          </p>
        </div>
      </div>
    </div>
  );
}