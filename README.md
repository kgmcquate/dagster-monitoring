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
├── App.tsx              # Main application component
└── deployment/          # Deployment configurations
    ├── docker/          # Docker build files
    └── k8s/            # Kubernetes manifests
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

The application supports both build-time and runtime configuration:

#### Build-time Configuration (Development)
- `VITE_DAGSTER_GRAPHQL_URL` - Dagster GraphQL endpoint
- `VITE_DAGSTER_BASE_URL` - Dagster UI base URL  
- `VITE_DAGSTER_AUTH_TOKEN` - Authentication token (if required)

#### Runtime Configuration (Production/Docker)
For production deployments, you can set environment variables at container runtime instead of build time:

- `VITE_DAGSTER_GRAPHQL_URL` - Will be injected at runtime
- `VITE_DAGSTER_BASE_URL` - Will be injected at runtime

This allows the same Docker image to be used across different environments with different Dagster instances.

## Deployment

### Build for Production

```bash
npm run build
```

The `build` folder contains the production-ready application.

### Docker Deployment

The project includes a complete Docker and Kubernetes deployment setup with runtime configuration support.

#### Runtime Configuration

The Docker container can be configured at runtime using environment variables, eliminating the need to rebuild the image for different environments:

```bash
# Run with custom Dagster instance
docker run -p 8080:80 \
  -e VITE_DAGSTER_GRAPHQL_URL="http://your-dagster:3000/graphql" \
  -e VITE_DAGSTER_BASE_URL="http://your-dagster:3000" \
  kgmcquate/dagster-monitoring:latest
```

#### Docker Compose Example

```yaml
version: '3.8'
services:
  dagster-monitoring:
    image: kgmcquate/dagster-monitoring:latest
    ports:
      - "8080:80"
    environment:
      - VITE_DAGSTER_GRAPHQL_URL=http://dagster-webserver:3000/graphql
      - VITE_DAGSTER_BASE_URL=http://dagster-webserver:3000
```

#### Automated Docker Hub Deployment

The GitHub Action automatically builds and pushes Docker images to Docker Hub. To set this up:

1. **Create Docker Hub account** and repository
2. **Add GitHub Secrets** in your repository settings:
   - `DOCKERHUB_USERNAME` - Your Docker Hub username
   - `DOCKERHUB_TOKEN` - Docker Hub access token (create at https://hub.docker.com/settings/security)

3. **Push to main branch** - Images will be automatically built and pushed to `kgmcquate/dagster-monitoring:latest`

#### Manual Docker Build

```bash
# Build the image
docker build -f deployment/docker/Dockerfile -t kgmcquate/dagster-monitoring .

# Run locally
docker run -p 8080:80 kgmcquate/dagster-monitoring

# Test the deployment
cd deployment/docker && ./test-docker.sh
```

#### Kubernetes Deployment

See `deployment/k8s/README.md` for complete Kubernetes deployment instructions.

```bash
# Quick deployment
kubectl apply -k deployment/k8s/
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
