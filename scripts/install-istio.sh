#!/usr/bin/env bash
set -euo pipefail

ISTIOCTL=${ISTIOCTL:-istioctl}
if ! command -v "$ISTIOCTL" >/dev/null 2>&1; then
  cat >&2 <<'EOF'
istioctl is required but was not found on PATH.
Install it using https://istio.io/latest/docs/setup/getting-started/#download,
then rerun this script. Alternatively install the istio-base and istiod Helm
charts, together with an Istio ingress gateway, before deploying this project.

If it is installed outside PATH, set ISTIOCTL to its full path, for example:
  ISTIOCTL=/path/to/istioctl ./scripts/install-istio.sh
EOF
  exit 1
fi

"$ISTIOCTL" install --set profile=demo -y

ISTIO_CRDS=(
  gateways.networking.istio.io
  virtualservices.networking.istio.io
  destinationrules.networking.istio.io
  telemetries.telemetry.istio.io
)
kubectl get crd "${ISTIO_CRDS[@]}"

# This is safe before or after the application namespace has been created.
if kubectl get namespace ecommerce >/dev/null 2>&1; then
  kubectl label namespace ecommerce istio-injection=enabled --overwrite
fi
