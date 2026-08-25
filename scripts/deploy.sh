#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
CURRENT_CONTEXT=$(kubectl config current-context)
if [[ "$CURRENT_CONTEXT" == kind-* ]]; then
  # Permit CLUSTER_NAME to override the current Kind context when needed.
  export CLUSTER_NAME=${CLUSTER_NAME:-"${CURRENT_CONTEXT#kind-}"}
fi

# The Istio overlay contains Istio custom resources.  Fail before building
# images when the cluster has not been bootstrapped with Istio yet.
ISTIO_CRDS=(
  gateways.networking.istio.io
  virtualservices.networking.istio.io
  destinationrules.networking.istio.io
  telemetries.telemetry.istio.io
)
if ! kubectl get crd "${ISTIO_CRDS[@]}" >/dev/null 2>&1; then
  cat >&2 <<'EOF'
Istio CRDs are not installed in the current cluster.
Install Istio first, then retry:
  ./scripts/install-istio.sh

The setup script requires istioctl. Install it using the official Istio guide,
or install the equivalent istio-base and istiod Helm charts (plus an ingress
gateway) before rerunning this deployment.
EOF
  exit 1
fi

"$ROOT/scripts/build.sh"
kubectl apply -k "$ROOT/k8s"
kubectl apply -k "$ROOT/istio"
kubectl -n ecommerce rollout status deployment --timeout=180s
kubectl -n ecommerce get pods,services
