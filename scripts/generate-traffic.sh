#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
kubectl apply -f "$ROOT/k8s/traffic-generator.yaml"
kubectl -n ecommerce rollout status deployment/traffic-generator --timeout=120s
kubectl -n ecommerce logs deployment/traffic-generator --tail=10 || true
