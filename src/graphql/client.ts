import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

// Configure the GraphQL endpoint for your Dagster instance
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_DAGSTER_GRAPHQL_URL || 'http://localhost:3000/graphql',
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Asset: {
        keyFields: ['key', ['path']],
      },
      MaterializationEvent: {
        keyFields: ['runId', 'timestamp'],
      },
      ObservationEvent: {
        keyFields: ['runId', 'timestamp'],
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});