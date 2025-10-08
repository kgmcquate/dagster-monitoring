import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { getRuntimeConfig } from '../utils/runtimeConfig';

// Configure the GraphQL endpoint for your Dagster instance
const config = getRuntimeConfig();
const httpLink = createHttpLink({
  uri: config.DAGSTER_GRAPHQL_URL,
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