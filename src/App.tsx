import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './graphql/client';
import { getRuntimeConfig } from './utils/runtimeConfig';
import { 
  Layout,
  Dashboard, 
  AssetsView, 
  MaterializationsView, 
  ObservationsView, 
  ChecksView 
} from './components';
import './index.css';

function App() {
  const config = getRuntimeConfig();
  const basePath = config.BASE_PATH || '';

  return (
    <ApolloProvider client={apolloClient}>
      <Router basename={basePath}>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/assets" element={<AssetsView />} />
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