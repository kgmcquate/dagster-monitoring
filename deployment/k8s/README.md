# Dagster Monitoring Dashboard - Kubernetes Deployment

This directory contains Kubernetes manifests for deploying the Dagster Monitoring Dashboard.

## Prerequisites

- Kubernetes cluster
- kubectl configured to access your cluster
- Docker registry access (GitHub Container Registry is configured by default)

## Quick Start

### 1. Build and Push Docker Image

The GitHub Action will automatically build and push the Docker image when you push to the main branch. The image will be available at:

```text
kgmcquate/dagster-monitoring:latest
```

### 2. Deploy to Kubernetes

#### Option A: Using kubectl

```bash
# Apply the manifests directly
kubectl apply -f deployment/k8s/deployment.yaml
```

#### Option B: Using Kustomize (Recommended)

```bash
# Deploy using kustomize
kubectl apply -k deployment/k8s/
```

### 3. Configure Ingress

Update the `k8s/deployment.yaml` file and replace `your-domain.com` with your actual domain name.

For HTTPS, uncomment the TLS section and ensure you have cert-manager installed:

```bash
# Install cert-manager (if not already installed)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### 4. Access the Application

After deployment, you can access the application via:

- **Port Forward (for testing):**
  ```bash
  kubectl port-forward service/dagster-monitoring-ui-service 8080:80
  ```
  Then visit http://localhost:8080

- **Ingress (production):** Visit your configured domain

## Configuration

### Environment Variables

If you need to configure the Dagster GraphQL endpoint, uncomment the environment variables section in `deployment.yaml`:

```yaml
env:
- name: REACT_APP_DAGSTER_GRAPHQL_URL
  value: "http://dagster-webserver:3000/graphql"
```

### Resource Limits

The default resource limits are conservative. Adjust based on your needs:

```yaml
resources:
  requests:
    memory: "64Mi"
    cpu: "50m"
  limits:
    memory: "128Mi"
    cpu: "100m"
```

### Scaling

To scale the deployment:

```bash
kubectl scale deployment dagster-monitoring-ui --replicas=3
```

## Monitoring

The deployment includes health checks:

- **Liveness Probe:** `/health` endpoint
- **Readiness Probe:** `/health` endpoint

## Troubleshooting

### Check Pod Status
```bash
kubectl get pods -l app=dagster-monitoring-ui
```

### View Logs
```bash
kubectl logs -l app=dagster-monitoring-ui --tail=100
```

### Describe Deployment
```bash
kubectl describe deployment dagster-monitoring-ui
```

### Check Service Endpoints
```bash
kubectl get endpoints dagster-monitoring-ui-service
```

## Security Considerations

1. **HTTPS:** Always use HTTPS in production by configuring TLS in the Ingress
2. **Network Policies:** Consider implementing network policies to restrict traffic
3. **Resource Limits:** Set appropriate resource limits to prevent resource exhaustion
4. **Image Scanning:** The GitHub Action includes image attestation for security

## Updates

To update the deployment with a new image:

1. Push changes to the main branch (triggers automatic build)
2. Update the image tag in `kustomization.yaml` or use:

   ```bash
   kubectl set image deployment/dagster-monitoring-ui dagster-monitoring-ui=kgmcquate/dagster-monitoring:new-tag
   ```

## Clean Up

To remove the deployment:

```bash
kubectl delete -k deployment/k8s/
```

Or:

```bash
kubectl delete -f deployment/k8s/deployment.yaml
```