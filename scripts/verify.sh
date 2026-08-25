#!/usr/bin/env bash
set -euo pipefail

kubectl -n ecommerce get pods,services
kubectl -n ecommerce get gateway,virtualservice,destinationrule,telemetry
kubectl -n ecommerce wait --for=condition=ready pod -l app=catalog-service --timeout=120s

POD=$(kubectl -n ecommerce get pod -l app=order-taking-service -o jsonpath='{.items[0].metadata.name}')
CONTAINERS=$(kubectl -n ecommerce get pod "$POD" -o jsonpath='{.spec.containers[*].name} {.spec.initContainers[*].name}')
echo "order-taking-service containers: $CONTAINERS"
echo "$CONTAINERS" | grep -q istio-proxy

# Runs from an injected workload, proving Kubernetes-DNS service communication.
kubectl -n ecommerce exec "$POD" -c app -- python -c "import urllib.request; print(urllib.request.urlopen('http://catalog-service.ecommerce.svc.cluster.local:8000/health').read().decode())"
kubectl -n ecommerce exec "$POD" -c app -- python -c "import urllib.request; print(urllib.request.urlopen('http://order-taking-service.ecommerce.svc.cluster.local:8000/api/orders', data=b'').read().decode())"

echo 'Canary weights:'
kubectl -n ecommerce get virtualservice catalog-service -o jsonpath='{range .spec.http[0].route[*]}{.destination.subset}={.weight}{"%\n"}{end}'
