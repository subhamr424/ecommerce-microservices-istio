import asyncio
import os
from contextvars import ContextVar
from datetime import datetime, timezone
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException
from prometheus_client import Counter, Histogram, make_asgi_app

SERVICE = os.getenv("SERVICE_NAME", "unknown-service")
VERSION = os.getenv("SERVICE_VERSION", "v1")
PORT = int(os.getenv("PORT", "8000"))
app = FastAPI(title=SERVICE, version=VERSION)
REQUESTS = Counter("ecommerce_requests_total", "HTTP requests served", ["service", "method", "path"])
DOWNSTREAM = Counter("ecommerce_downstream_requests_total", "Kubernetes DNS calls", ["source", "target", "outcome"])
LATENCY = Histogram("ecommerce_request_duration_seconds", "Request duration", ["service"])
TRACE_HEADERS = ("x-request-id", "x-b3-traceid", "x-b3-spanid", "x-b3-parentspanid", "x-b3-sampled", "x-b3-flags", "b3", "traceparent", "tracestate")
DOWNSTREAM_TRACE_HEADERS: ContextVar[dict[str, str]] = ContextVar("downstream_trace_headers", default={})

CATALOG = [
    {"id": "sku-100", "name": "Mesh Runner", "price": 79.99, "stock": 18, "category": "shoes"},
    {"id": "sku-200", "name": "Everyday Tee", "price": 24.99, "stock": 42, "category": "apparel"},
    {"id": "sku-300", "name": "Canvas Tote", "price": 19.99, "stock": 9, "category": "accessories"},
]
USERS = [{"id": "u-100", "name": "Asha Rao", "email": "asha@example.test", "tier": "gold"}]
CARTS = {"u-100": [{"product_id": "sku-100", "quantity": 1}]}
WISHLISTS = {"u-100": ["sku-300"]}

@app.middleware("http")
async def observe(request, call_next):
    trace_headers = {header: request.headers[header] for header in TRACE_HEADERS if header in request.headers}
    trace_context = DOWNSTREAM_TRACE_HEADERS.set(trace_headers)
    try:
        with LATENCY.labels(SERVICE).time():
            response = await call_next(request)
    finally:
        DOWNSTREAM_TRACE_HEADERS.reset(trace_context)
    REQUESTS.labels(SERVICE, request.method, request.url.path).inc()
    response.headers["x-ecommerce-service"] = SERVICE
    response.headers["x-ecommerce-version"] = VERSION
    return response

async def dns_get(service: str, path: str) -> Any:
    url = f"http://{service}.ecommerce.svc.cluster.local:8000{path}"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            response = await client.get(url, headers=DOWNSTREAM_TRACE_HEADERS.get())
            response.raise_for_status()
        DOWNSTREAM.labels(SERVICE, service, "success").inc()
        return response.json()
    except Exception as exc:
        DOWNSTREAM.labels(SERVICE, service, "error").inc()
        return {"service": service, "reachable": False, "detail": str(exc)[:120]}

@app.get("/health")
async def health():
    return {"status": "ok", "service": SERVICE, "version": VERSION}

@app.get("/")
async def index():
    return {"service": SERVICE, "version": VERSION, "time": datetime.now(timezone.utc).isoformat()}

@app.get("/api/users/{user_id}")
async def get_user(user_id: str):
    user = next((x for x in USERS if x["id"] == user_id), None)
    if not user: raise HTTPException(404, "user not found")
    return user

@app.get("/api/catalog/products")
async def products(q: str = ""):
    result = [p for p in CATALOG if q.lower() in p["name"].lower()]
    return {"products": result, "catalog_release": "classic storefront" if VERSION == "v1" else "new storefront — beta pricing labels", "version": VERSION}

@app.get("/api/catalog/products/{product_id}")
async def product(product_id: str):
    item = next((p for p in CATALOG if p["id"] == product_id), None)
    if not item: raise HTTPException(404, "product not found")
    return {**item, "catalog_release": "classic v1" if VERSION == "v1" else "v2 beta: sustainability score enabled", "version": VERSION}

@app.get("/api/search")
async def search(q: str = ""):
    catalog = await dns_get("catalog-service", f"/api/catalog/products?q={q}")
    return {"query": q, "source": "catalog-service via Kubernetes DNS", "results": catalog.get("products", [])}

@app.get("/api/carts/{user_id}")
async def cart(user_id: str):
    items = CARTS.get(user_id, [])
    return {"user_id": user_id, "items": items, "item_count": sum(x["quantity"] for x in items)}

@app.post("/api/carts/{user_id}/items/{product_id}")
async def add_cart_item(user_id: str, product_id: str):
    CARTS.setdefault(user_id, []).append({"product_id": product_id, "quantity": 1})
    return await cart(user_id)

@app.get("/api/wishlists/{user_id}")
async def wishlist(user_id: str):
    return {"user_id": user_id, "products": WISHLISTS.get(user_id, [])}

@app.post("/api/orders")
async def take_order(user_id: str = "u-100"):
    user, basket = await asyncio.gather(dns_get("user-service", f"/api/users/{user_id}"), dns_get("cart-service", f"/api/carts/{user_id}"))
    processing = await dns_get("order-processing-service", "/api/orders/process?order_id=ord-100")
    return {"order_id": "ord-100", "status": "accepted", "customer": user, "cart": basket, "processing": processing}

@app.get("/api/orders/process")
async def process_order(order_id: str = "ord-100"):
    payment, inventory = await asyncio.gather(dns_get("payment-service", f"/api/payments/authorize?order_id={order_id}"), dns_get("warehouse-service", "/api/inventory/sku-100"))
    shipping = await dns_get("logistics-service", f"/api/shipments?order_id={order_id}")
    notification = await dns_get("notification-service", f"/api/notifications?order_id={order_id}")
    return {"order_id": order_id, "status": "processing", "payment": payment, "inventory": inventory, "shipping": shipping, "notification": notification}

@app.get("/api/payments/authorize")
async def payment(order_id: str = "ord-100"):
    return {"order_id": order_id, "authorized": True, "provider": "local-pay"}

@app.get("/api/shipments")
async def shipment(order_id: str = "ord-100"):
    return {"order_id": order_id, "carrier": "LocalPost", "status": "label-created"}

@app.get("/api/inventory/{product_id}")
async def inventory(product_id: str):
    return {"product_id": product_id, "warehouse": "blr-01", "available": 18, "reserved": 1}

@app.get("/api/notifications")
async def notification(order_id: str = "ord-100"):
    return {"order_id": order_id, "channel": "email", "queued": True}

@app.get("/api/recommendations/{user_id}")
async def recommendations(user_id: str):
    catalog = await dns_get("catalog-service", "/api/catalog/products")
    return {"user_id": user_id, "strategy": "popular-items", "recommendations": catalog.get("products", [])[:2]}

app.mount("/metrics", make_asgi_app())
