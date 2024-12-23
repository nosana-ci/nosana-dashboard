
# Nosana Dashboard Helm Chart

This Helm chart facilitates the deployment of the Nosana Dashboard on a K3s cluster. It provides a simple and customizable way to manage the deployment, service, and optional ingress resources.

## Prerequisites

- Helm 3 installed
- A running K3s cluster
- `kubectl` configured to communicate with your cluster

## Installation Instructions

### 1. Clone the repository

```bash
git clone https://github.com/your-username/nosana-dashboard.git
cd nosana-dashboard/helm/nosana-dashboard
```

### 2. Install the Helm chart

```bash
helm install nosana-dashboard ./nosana-dashboard
```

This will deploy the Nosana Dashboard using the default values from `values.yaml`.

## Configuration

The chart comes with configurable parameters that you can customize based on your needs. These parameters can be adjusted in the `values.yaml` file or passed as command-line arguments during installation.

### Parameters

| Parameter             | Description                                      | Default                      |
|-----------------------|--------------------------------------------------|------------------------------|
| `replicaCount`        | Number of replicas for the deployment            | `1`                          |
| `image.repository`    | Docker image repository                          | `nosana/nosana-dashboard`    |
| `image.tag`           | Docker image tag                                 | `latest`                     |
| `image.pullPolicy`    | Image pull policy                                | `IfNotPresent`               |
| `service.type`        | Kubernetes Service type                          | `ClusterIP`                  |
| `service.port`        | Port for the service                             | `80`                         |
| `resources`           | Resource limits and requests for the container   | `{}`                         |
| `nodeSelector`        | Node labels for pod assignment                   | `{}`                         |
| `tolerations`         | Tolerations for pod assignment                   | `[]`                         |
| `affinity`            | Affinity rules for pod assignment                | `{}`                         |

### Example Customization

You can customize the deployment using `--set` parameters:

```bash
helm install nosana-dashboard ./nosana-dashboard --set replicaCount=2 --set service.type=LoadBalancer
```

Or by editing the `values.yaml` file directly.

## Uninstalling the Chart

To uninstall/delete the deployment, use the following command:

```bash
helm uninstall nosana-dashboard
```

This will remove all Kubernetes resources associated with the release.

## Notes

- If using Ingress, ensure your K3s cluster has an Ingress Controller like Traefik configured.
- For additional customization or troubleshooting, refer to the [Helm documentation](https://helm.sh/docs/).
