# Dagster Monitoring Dashboard

A React TypeScript application for monitoring Dagster assets, materializations, observations, and checks.

## Features

- 📊 **Dashboard Overview**: Real-time statistics and charts
- 🏗️ **Asset Management**: Browse and monitor all assets
- 📈 **Materialization Tracking**: View asset materialization history
- 👁️ **Observation Monitoring**: Track asset quality metrics
- ✅ **Asset Checks**: Monitor validation checks and results
- 🔍 **Search & Filtering**: Find assets and events quickly
- 📱 **Responsive Design**: Works on desktop and mobile

## Quick Start

### Prerequisites

- Node.js 16+ and npm
- Running Dagster instance with GraphQL API enabled

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Configure Dagster connection**:

   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and set your Dagster GraphQL URL:

   ```env
   VITE_DAGSTER_GRAPHQL_URL=http://your-dagster-instance:3000/graphql
   ```

3. **Start the development server**:

   ```bash
   npm run dev
   ```

4. **Open your browser**: Navigate to `http://localhost:3000`

## GraphQL Schema Integration

This dashboard integrates with Dagster's GraphQL API to fetch:

### Assets
- Asset metadata and definitions
- Health status (Fresh/Stale/Missing)
- Asset lineage and dependencies

### Materializations
- Materialization events and timestamps
- Run information and performance stats
- Partition data for partitioned assets

### Observations
- Asset observation events
- Quality metrics and metadata
- Log levels and diagnostics

### Asset Checks
- Check definitions and configurations
- Execution results and status
- Blocking vs non-blocking checks

## Project Structure

```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard view
│   ├── AssetsView.tsx   # Asset listing and search
│   ├── AssetDetailView.tsx # Individual asset details
│   ├── MaterializationsView.tsx # Materialization history
│   ├── ObservationsView.tsx # Observation tracking
│   ├── ChecksView.tsx   # Asset checks overview
│   └── charts/          # Chart components
├── graphql/             # GraphQL queries and client
│   ├── client.ts        # Apollo Client configuration
│   └── queries.ts       # GraphQL query definitions
├── types/               # TypeScript type definitions
│   └── dagster.ts       # Dagster-specific types
└── App.tsx              # Main application component
```

## Available Scripts

- `npm run dev` - Start development server
- `npm start` - Start development server (alias for dev)
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Customization

### Adding New Queries

1. Define your GraphQL query in `src/graphql/queries.ts`
2. Add corresponding TypeScript types in `src/types/dagster.ts`
3. Create or update components to use the new query

### Styling

The project uses Tailwind CSS for styling. Key classes:

- `.card` - Standard card component
- `.status-badge` - Status indicator badges
- `.status-fresh`, `.status-stale`, `.status-missing` - Health status colors

### Environment Variables

- `VITE_DAGSTER_GRAPHQL_URL` - Dagster GraphQL endpoint
- `VITE_DAGSTER_AUTH_TOKEN` - Authentication token (if required)

## Deployment

### Build for Production

```bash
npm run build
```

The `build` folder contains the production-ready application.

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:16-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Troubleshooting

### Common Issues

**Connection Errors**:
- Verify Dagster instance is running
- Check GraphQL URL in `.env` file
- Ensure CORS is configured if running on different domains

**No Data Showing**:
- Confirm assets exist in your Dagster instance
- Check browser console for GraphQL errors
- Verify GraphQL queries match your Dagster version

**Performance Issues**:
- Adjust polling intervals in query configurations
- Implement pagination for large datasets
- Consider adding query result caching

## License

MIT License - see LICENSE file for details.
Web dashboard for monitoring Dagster Asset health
