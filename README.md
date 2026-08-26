# ecommerce-microservices-istio

Twelve-service e-commerce backend on Kubernetes, meshed with Istio. Built to exercise
the mesh primitives that matter in production — traffic splitting, mTLS, outlier
detection, distributed tracing — rather than to model a real product domain. The
business logic is intentionally trivial; the platform around it is not.

## Design decisions

**Mesh over a hand-rolled gateway layer.** Every service is behind an Envoy sidecar.
mTLS, retries, circuit breaking, and trace propagation are enforced at the sidecar,
not in application code — so `services/common/app.py` has zero networking-resilience
logic in it. This is the point: policy lives in `istio/`, not in Python.

**One shared FastAPI app, twelve deployments.** Identical image, differentiated at
runtime by `SERVICE_NAME` / `SERVICE_VERSION`. Reduces this to a routing and mesh-policy
exercise rather than twelve codebases to maintain. Not how I'd structure a real product
— fine for a platform lab.

**No datastore, no frontend.** In-memory state, JSON-only APIs. Anything below the
mesh layer would be noise here.

## Topology

```
ingress (Istio Gateway)
  │
  ├─ catalog-service (v1/v2, 90/10 DestinationRule split)
  ├─ search, recommendation, cart, wishlist, user
  │
  └─ order-taking ──▶ order-processing ──┬─▶ payment
                                          ├─▶ warehouse
                                          ├─▶ logistics
                                          └─▶ notification
```

All arrows are sidecar-to-sidecar. No service holds another service's IP or makes an
unmediated call.

## What's enforced, and how it's verified

| Control | Mechanism | Verification |
|---|---|---|
| Canary release | `DestinationRule` subsets (v1/v2) + weighted `VirtualService` route, applied identically on ingress and mesh gateways | 100-request sample against `/catalog/products`, version distribution checked |
| mTLS | `PeerAuthentication` STRICT, namespace-wide | Unmeshed pod issuing plaintext request to `catalog-service` must fail with connection reset |
| Fault isolation | `outlierDetection` (3× 5xx → 30s ejection, 50% max ejection) + bounded connection pools on every `DestinationRule` | Circuit state visible in Kiali; not load-tested to failure in this lab |
| Timeout/retry budget | 3 attempts, 2s per-try, 10s total, mesh-wide | N/A — policy-level, exercised implicitly by traffic generator |
| Trace propagation | Envoy B3/W3C headers, forwarded explicitly on every downstream `httpx` call in the shared app | Single trace spans `order-taking → order-processing → {payment, warehouse, logistics, notification}` in Jaeger |

## Observability

Metrics, traces, and the live topology graph are separate systems reading the same
underlying signal:

- **Prometheus** scrapes every sidecar's `/stats/prometheus` via a `role: pod`
  discovery job matched on the `prometheus.io/scrape` annotation.
- **Kiali** renders the mesh graph from Prometheus — request volume, success rate, and
  per-edge mTLS status.
- **Jaeger** ingests trace spans forwarded through the mesh; the Service Performance
  Monitoring view derives p50/p75/p95 latency and error rate per operation without a
  separate metrics pipeline.
- **Grafana** for cluster/node metrics; **Loki** for log aggregation.

```bash
kubectl -n istio-system port-forward svc/kiali 20001:20001      # traffic graph
kubectl -n istio-system port-forward svc/tracing 16686:80       # traces
kubectl -n istio-system port-forward svc/grafana 3000:3000      # dashboards
```

## Running it

```bash
./scripts/install-istio.sh      # istioctl install --set profile=demo, verifies CRDs
./scripts/deploy.sh             # build all images, load into kind, apply k8s/ + istio/
./scripts/generate-traffic.sh   # continuous low-rate load, keeps graphs populated
./scripts/verify.sh             # smoke test + canary distribution check
```

`deploy.sh` resolves the target Kind cluster name from the active kubeconfig context
rather than a hardcoded value — it will target whatever cluster `kubectl` currently
points at.

## Reaching the services

Single ingress gateway, path-routed, no port-forward required:

```bash
kubectl -n istio-system get svc istio-ingressgateway
docker inspect <cluster-name>-control-plane --format '{{.NetworkSettings.Networks.kind.IPAddress}}'
```

| Path | Service |
|---|---|
| `/catalog/products` | catalog-service (canary) |
| `/search?q=` | search-service |
| `/recommendations/{user_id}` | recommendation-service |
| `/cart/{user_id}` | cart-service |
| `/wishlist/{user_id}` | wishlist-service |
| `/orders` — POST | order-taking-service |
| `/order-processing` | order-processing-service |
| `/payments` | payment-service |
| `/logistics` | logistics-service |
| `/warehouse/{product_id}` | warehouse-service |
| `/notifications` | notification-service |
| `/users/{user_id}` | user-service |

Kind's node IP is a Docker bridge address and is not stable across container
recreation; re-resolve it if a previously-working URL starts failing.

## Failure modes encountered building this

Kept here because they're representative of real mesh operations, not lab artifacts:

**Prometheus was blind to the application namespace.** The Istio demo profile ships
Prometheus with static scrape targets for Jaeger and node-exporter only — no
`kubernetes_sd_configs` job watching pod annotations. Traffic was flowing and the mesh
was enforcing policy correctly the entire time; the observability layer simply had no
scrape target for it. Root cause was a missing job in the ConfigMap, not an app or
mesh fault — worth internalizing, since it's easy to misdiagnose an observability gap
as a data-plane problem.

**`kind load docker-image` failed against a hardcoded cluster name.** `deploy.sh` now
derives the name from `kubectl config current-context`.

**Traffic generator saw a `504` immediately post-rollout.** Envoy config propagation
to all sidecars is asymptotic, not atomic — a request that lands in the gap between
"deployment rolled out" and "all sidecars have the updated route table" will fail.
Not a bug; addressed with a startup delay and `curl --retry` rather than treating it
as an application defect.

## Explicitly out of scope

- `AuthorizationPolicy` — no service-to-service authorization above the mTLS identity
  layer; any meshed workload can currently call any other.
- Autoscaling, CI/CD, GitOps.
- Persistence, frontend.

None of these are oversights — they're outside what this lab is testing. Listed here
so the gap is a decision, not a discovery.

## Layout

```
services/   Shared FastAPI app + one Dockerfile per service
k8s/        Namespace, Deployments, Services, traffic generator
istio/      Gateway, VirtualServices, DestinationRules, PeerAuthentication, Telemetry
scripts/    install-istio.sh · deploy.sh · generate-traffic.sh · verify.sh
```
