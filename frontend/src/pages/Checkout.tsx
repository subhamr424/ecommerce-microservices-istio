import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { cartApi, catalogApi, orderApi, userApi } from "../api/client";
import { Loading, ErrorState } from "../components/States";

export default function Checkout() {
  const navigate = useNavigate();
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: () => cartApi.get() });
  const { data: catalog } = useQuery({ queryKey: ["catalog"], queryFn: () => catalogApi.list() });
  const { data: user } = useQuery({ queryKey: ["user"], queryFn: () => userApi.get() });

  const placeOrder = useMutation({
    mutationFn: () => orderApi.place(),
    onSuccess: (data) => {
      setPlacedOrderId(data.order_id);
      navigate(`/orders/${data.order_id}/confirmation`, { state: data });
    },
  });

  const lines = (cart?.items ?? []).map((item) => {
    const product = catalog?.products.find((p) => p.id === item.product_id);
    return { ...item, product };
  });
  const total = lines.reduce((sum, l) => sum + (l.product?.price ?? 0) * l.quantity, 0);

  if (!cart || !user) return <Loading label="Loading checkout" />;

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl font-semibold text-ink">Checkout</h1>

      <div className="rounded-2xl border border-line bg-white/50 p-6">
        <p className="text-xs uppercase tracking-wide text-ink/50">Shipping to</p>
        <p className="mt-1 font-medium text-ink">{user.name}</p>
        <p className="text-sm text-ink/60">{user.email}</p>
        <p className="mt-1 text-xs text-moss-700">{user.tier} member</p>
      </div>

      <ul className="mt-6 divide-y divide-line rounded-2xl border border-line bg-white/50">
        {lines.map((l) => (
          <li key={l.product_id} className="flex items-center justify-between p-4 text-sm">
            <span>{l.product?.name ?? l.product_id} × {l.quantity}</span>
            <span className="font-medium">${((l.product?.price ?? 0) * l.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between rounded-2xl bg-moss-900 px-6 py-5 text-canvas">
        <span className="font-display text-lg font-semibold">Total due</span>
        <span className="font-display text-lg font-semibold">${total.toFixed(2)}</span>
      </div>

      {placeOrder.isError && (
        <div className="mt-4">
          <ErrorState message="order-taking-service didn't accept the order. Try again." />
        </div>
      )}

      <button
        onClick={() => placeOrder.mutate()}
        disabled={placeOrder.isPending || lines.length === 0}
        className="mt-6 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-moss-700 disabled:opacity-40"
      >
        {placeOrder.isPending ? "Placing order…" : `Place order — $${total.toFixed(2)}`}
      </button>
    </div>
  );
}
