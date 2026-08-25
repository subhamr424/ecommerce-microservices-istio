# E-Commerce Microservices on Kubernetes + Istio

A 12-service e-commerce backend deployed on Kubernetes with an Istio service mesh —
canary releases, mTLS, circuit breaking, retries, distributed tracing, and full
observability (Kiali, Prometheus, Grafana).

## Architecture

12 FastAPI microservices running in the `ecommerce` namespace, meshed with Istio:

`catalog` (v1/v2 canary) · `search` · `recommendation` · `cart` · `wishlist` ·
`order-taking` · `order-processing` · `payment` · `logistics` · `warehouse` ·
`notification` · `user`

## Features

- **Canary deployment** — catalog-service v1/v2 with a 90/10 traffic split
- **Strict mTLS** — all service-to-service traffic encrypted, plaintext rejected
- **Resilience** — circuit breaking (outlier detection), retries, timeouts on every service
- **Distributed tracing** — Jaeger, propagated across the full order workflow
- **Observability** — Kiali traffic graphs, Prometheus metrics, Grafana dashboards
- **Single entrypoint** — all 12 services reachable through one Istio ingress gateway

## Prerequisites

- Docker
- `kubectl` (pointed at a working cluster)
- `kind`
- `istioctl`

## Setup

```bash
# 1. Install Istio
./scripts/install-istio.sh

# 2. Build and deploy
./scripts/deploy.sh

# 3. Generate traffic and verify
./scripts/generate-traffic.sh
./scripts/verify.sh
```

## Access

Find the ingress endpoint:

```bash
kubectl -n istio-system get svc istio-ingressgateway
docker inspect <cluster-name>-control-plane --format '{{.NetworkSettings.Networks.kind.IPAddress}}'
```

Then browse to `http://<node-ip>:<nodeport>/<path>`:

| Path | Service |
|---|---|
| `/catalog/products` | catalog-service (canary) |
| `/search?q=...` | search-service |
| `/recommendations/{user_id}` | recommendation-service |
| `/cart/{user_id}` | cart-service |
| `/wishlist/{user_id}` | wishlist-service |
| `/orders` (POST) | order-taking-service |
| `/order-processing` | order-processing-service |
| `/payments` | payment-service |
| `/logistics` | logistics-service |
| `/warehouse/{product_id}` | warehouse-service |
| `/notifications` | notification-service |
| `/users/{user_id}` | user-service |

## Observability

```bash
kubectl -n istio-system port-forward svc/kiali 20001:20001       # http://localhost:20001
kubectl -n istio-system port-forward svc/tracing 16686:80        # http://localhost:16686/jaeger
kubectl -n istio-system port-forward svc/grafana 3000:3000       # http://localhost:3000
```

## Verify canary split

```bash
for n in $(seq 1 100); do curl -s http://<node-ip>:<nodeport>/catalog/products | jq -r .version; done | sort | uniq -c
```
Should trend near 90% v1 / 10% v2.

## Verify mTLS

```bash
kubectl run mtls-probe --namespace default --image=curlimages/curl:8.10.1 \
  --restart=Never --rm -i -- curl --max-time 5 --fail \
  http://catalog-service.ecommerce.svc.cluster.local:8000/health
```
Should fail — plaintext traffic from an unmeshed namespace is rejected.

## Project layout

```
services/   FastAPI source + Dockerfiles, one per service
k8s/        Namespace, Deployments, Services, traffic generator
istio/      Gateway, VirtualServices, DestinationRules, mTLS/telemetry policies
scripts/    build / deploy / generate-traffic / verify
```

## Roadmap

- [ ] React frontend
- [ ] Horizontal Pod Autoscaling
- [ ] AuthorizationPolicy (service-to-service access control)
- [ ] CI/CD pipeline
- [ ] GitOps (ArgoCD)
