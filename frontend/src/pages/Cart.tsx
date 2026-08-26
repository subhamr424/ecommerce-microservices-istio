import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cartApi, catalogApi } from "../api/client";
import { Loading, ErrorState, EmptyState } from "../components/States";

export default function Cart() {
  const navigate = useNavigate();
  const { data: cart, isLoading, isError } = useQuery({ queryKey: ["cart"], queryFn: () => cartApi.get() });
  const { data: catalog } = useQuery({ queryKey: ["catalog"], queryFn: () => catalogApi.list() });

  if (isLoading) return <Loading label="Loading cart" />;
  if (isError || !cart) return <ErrorState message="cart-service didn't respond." />;

  const lines = cart.items.map((item) => {
    const product = catalog?.products.find((p) => p.id === item.product_id);
    return { ...item, product };
  });
  const total = lines.reduce((sum, l) => sum + (l.product?.price ?? 0) * l.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl font-semibold text-ink">Your cart</h1>

      {lines.length === 0 ? (
        <EmptyState title="Your cart is empty" body="Add something from the catalog to see it here." />
      ) : (
        <>
          <ul className="divide-y divide-line rounded-2xl border border-line bg-white/50">
            {lines.map((l) => (
              <li key={l.product_id} className="flex items-center justify-between gap-4 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-moss-500 font-display text-lg font-semibold text-white/90">
                    {(l.product?.name ?? l.product_id).charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-ink">{l.product?.name ?? l.product_id}</p>
                    <p className="text-sm text-ink/50">Qty {l.quantity}</p>
                  </div>
                </div>
                <p className="font-medium text-ink">
                  ${((l.product?.price ?? 0) * l.quantity).toFixed(2)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-moss-900 px-6 py-5 text-canvas">
            <span className="font-display text-lg font-semibold">Total</span>
            <span className="font-display text-lg font-semibold">${total.toFixed(2)}</span>
          </div>

          <button
            onClick={() => navigate("/checkout")}
            className="mt-6 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-moss-700"
          >
            Proceed to checkout
          </button>
        </>
      )}

      <Link to="/products" className="mt-6 inline-block text-sm text-ink/50 hover:text-ink">
        ← Keep shopping
      </Link>
    </div>
  );
}
