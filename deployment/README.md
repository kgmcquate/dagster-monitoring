# Deployment

This directory contains all deployment-related files for the Dagster Monitoring Dashboard.

## Directory Structure

```
deployment/
├── docker/                 # Docker-related files
│   ├── Dockerfile         # Multi-stage Docker build
│   ├── nginx.conf         # Nginx configuration for serving React app
│   ├── .dockerignore      # Docker build exclusions
│   └── test-docker.sh     # Local Docker testing script
└── k8s/                   # Kubernetes deployment files
    ├── deployment.yaml    # K8s deployment, service, and ingress
    ├── kustomization.yaml # Kustomize configuration
    └── README.md          # Detailed K8s deployment guide
```

## Quick Start

### Docker Deployment

```bash
# Build and test locally
cd deployment/docker
./test-docker.sh

# Or build manually
docker build -f deployment/docker/Dockerfile -t dagster-monitoring .
docker run -p 8080:80 dagster-monitoring
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -k deployment/k8s/

# Check status
kubectl get pods -l app=dagster-monitoring-ui
```

## CI/CD

The GitHub Action in `.github/workflows/docker-build.yml` automatically:

1. Builds Docker images on push to main
2. Pushes to Docker Hub as `kgmcquate/dagster-monitoring`
3. Supports multi-architecture builds (AMD64/ARM64)

## Configuration

### Docker Hub Secrets

Add these GitHub repository secrets:
- `DOCKERHUB_USERNAME` - Your Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token

### Environment Variables

Configure Dagster connection by setting environment variables in the Kubernetes deployment:

```yaml
env:
- name: REACT_APP_DAGSTER_GRAPHQL_URL
  value: "http://dagster-webserver:3000/graphql"
```

## Production Considerations

1. **Resource Limits**: Adjust CPU/memory limits in `k8s/deployment.yaml`
2. **Scaling**: Configure horizontal pod autoscaler for high traffic
3. **Security**: Enable HTTPS and configure ingress TLS
4. **Monitoring**: Add logging and metrics collection
5. **Backup**: Consider persistent volumes for any local state

## Troubleshooting

See `k8s/README.md` for detailed troubleshooting steps including:
- Pod status checks
- Log viewing
- Service endpoint verification
- Common deployment issues