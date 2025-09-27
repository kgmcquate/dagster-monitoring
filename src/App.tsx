import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './graphql/client';
import { 
  Layout,
  Dashboard, 
  AssetsView, 
  AssetDetailView, 
  MaterializationsView, 
  ObservationsView, 
  ChecksView 
} from './components';
import './index.css';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<AssetsView />} />
            <Route path="/assets/:assetPath" element={<AssetDetailView />} />
            <Route path="/materializations" element={<MaterializationsView />} />
            <Route path="/observations" element={<ObservationsView />} />
            <Route path="/checks" element={<ChecksView />} />
          </Routes>
        </Layout>
      </Router>
    </ApolloProvider>
  );
}

export default App;