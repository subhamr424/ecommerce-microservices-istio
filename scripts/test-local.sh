#!/usr/bin/env bash
set -euo pipefail

ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
python3 -m venv "$ROOT/.venv"
"$ROOT/.venv/bin/pip" install -q -r "$ROOT/requirements.txt"
PYTHONPATH="$ROOT/services/common" "$ROOT/.venv/bin/python" -c "import app; assert app.SERVICE; print('FastAPI application import: OK')"
for service in user-service search-service catalog-service cart-service wishlist-service order-taking-service order-processing-service payment-service logistics-service warehouse-service notification-service recommendation-service; do
  SERVICE_NAME="$service" PYTHONPATH="$ROOT/services/common" "$ROOT/.venv/bin/python" -c "import app; from fastapi.testclient import TestClient; r=TestClient(app.app).get('/health'); assert r.status_code == 200 and r.json()['service'] == '$service'; print('$service: OK')"
done
