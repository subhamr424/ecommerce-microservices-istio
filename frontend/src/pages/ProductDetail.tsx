import { useParams, Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { catalogApi, cartApi } from "../api/client";
import { Loading, ErrorState } from "../components/States";

export default function ProductDetail() {
  const { id = "" } = useParams();
  const qc = useQueryClient();

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["product", id],
    queryFn: () => catalogApi.get(id),
  });

  const addToCart = useMutation({
    mutationFn: () => cartApi.addItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(`${product?.name ?? "Item"} added to cart`);
    },
    onError: () => toast.error("cart-service is unreachable — try again"),
  });

  if (isLoading) return <Loading label="Loading product" />;
  if (isError || !product) return <ErrorState message="catalog-service couldn't find this product." />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <Link to="/products" className="mb-6 inline-block text-sm text-ink/50 hover:text-ink">
        ← Back to catalog
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div className="flex aspect-square items-center justify-center rounded-3xl bg-moss-600">
          <span className="font-display text-7xl font-semibold text-white/90">
            {product.name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink/50">{product.category}</p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">{product.name}</h1>
          <p className="mt-3 text-2xl font-medium text-ink">${product.price.toFixed(2)}</p>
          <p className="mt-4 text-sm text-ink/60">{product.catalog_release}</p>
          <p className="mt-1 text-xs text-ink/40">
            {product.stock > 0 ? `${product.stock} in stock` : "Currently out of stock"} · catalog {product.version}
          </p>

          <button
            onClick={() => addToCart.mutate()}
            disabled={addToCart.isPending || product.stock === 0}
            className="mt-8 w-full rounded-full bg-ink px-6 py-3 text-sm font-semibold text-canvas transition hover:bg-moss-700 disabled:opacity-40"
          >
            {addToCart.isPending ? "Adding…" : "Add to cart"}
          </button>
        </div>
      </div>
    </div>
  );
}
