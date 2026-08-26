import { Link, useLocation, useParams } from "react-router-dom";
import { OrderResponse } from "../api/client";

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const location = useLocation();
  const order = location.state as OrderResponse | undefined;

  if (!order) {
    return (
      <div className="mx-auto max-w-xl px-6 py-20 text-center">
        <p className="font-display text-2xl font-semibold text-ink">Order {orderId}</p>
        <p className="mt-2 text-sm text-ink/60">
          Refreshing this page loses the in-memory order detail — place a new order to see the full trace.
        </p>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-moss-700 hover:underline">
          ← Back home
        </Link>
      </div>
    );
  }

  const steps = [
    { label: "Order accepted", done: true },
    { label: "Payment authorized", done: order.processing.payment.authorized, meta: order.processing.payment.provider },
    { label: "Inventory reserved", done: order.processing.inventory.available > 0, meta: order.processing.inventory.warehouse },
    { label: "Shipment created", done: order.processing.shipping.status === "label-created", meta: order.processing.shipping.carrier },
    { label: "Notification queued", done: order.processing.notification.queued, meta: order.processing.notification.channel },
  ];

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-moss-500 text-2xl text-white">
          ✓
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink">Order placed</h1>
        <p className="mt-1 text-sm text-ink/60">
          #{order.order_id} · confirmation for {order.customer.name}
        </p>
      </div>

      <ol className="mt-10 space-y-3">
        {steps.map((s) => (
          <li
            key={s.label}
            className="flex items-center justify-between rounded-xl border border-line bg-white/50 px-5 py-4"
          >
            <span className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                  s.done ? "bg-moss-600" : "bg-line text-ink/40"
                }`}
              >
                {s.done ? "✓" : "·"}
              </span>
              <span className="font-medium text-ink">{s.label}</span>
            </span>
            {s.meta && <span className="text-xs text-ink/50">{s.meta}</span>}
          </li>
        ))}
      </ol>

      <p className="mt-8 text-center text-xs text-ink/40">
        This trace ran through order-taking → order-processing → payment / warehouse /
        logistics / notification, propagated as one Jaeger trace across the mesh.
      </p>

      <Link
        to="/products"
        className="mx-auto mt-8 block w-fit rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas hover:bg-moss-700"
      >
        Continue shopping
      </Link>
    </div>
  );
}
