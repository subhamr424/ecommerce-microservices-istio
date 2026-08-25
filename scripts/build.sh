#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
TAG=${TAG:-latest}
IMAGE_PREFIX=${IMAGE_PREFIX:-ecommerce}
SERVICES=(user-service search-service catalog-service cart-service wishlist-service order-taking-service order-processing-service payment-service logistics-service warehouse-service notification-service recommendation-service)

for service in "${SERVICES[@]}"; do
  docker build -f "$ROOT/services/$service/Dockerfile" -t "$IMAGE_PREFIX/$service:$TAG" "$ROOT"
done

# Kind's nodes cannot see Docker's local image store until images are loaded.
# Allow an explicit override, otherwise derive the Kind cluster from the current
# kubeconfig context (for example, "kind-dev-cluster" -> "dev-cluster").
CURRENT_CONTEXT=$(kubectl config current-context 2>/dev/null || true)
if command -v kind >/dev/null && [[ "$CURRENT_CONTEXT" == kind-* ]]; then
  CLUSTER_NAME=${CLUSTER_NAME:-"${CURRENT_CONTEXT#kind-}"}
  for service in "${SERVICES[@]}"; do
    kind load docker-image --name "$CLUSTER_NAME" "$IMAGE_PREFIX/$service:$TAG"
  done
fi
