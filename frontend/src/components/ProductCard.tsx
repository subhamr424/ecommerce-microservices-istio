import { Link } from "react-router-dom";
import { Product } from "../api/client";

const SWATCH: Record<string, string> = {
  shoes: "bg-moss-500",
  apparel: "bg-rust",
  accessories: "bg-moss-700",
};

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/products/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-line bg-white/50 transition hover:border-moss-500 hover:shadow-md"
    >
      <div className={`flex h-40 items-center justify-center ${SWATCH[product.category] ?? "bg-moss-300"}`}>
        <span className="font-display text-4xl font-semibold text-white/90">
          {product.name.charAt(0)}
        </span>
      </div>
      <div className="space-y-1 p-4">
        <p className="text-xs uppercase tracking-wide text-ink/50">{product.category}</p>
        <h3 className="font-display text-base font-semibold text-ink group-hover:text-moss-700">
          {product.name}
        </h3>
        <div className="flex items-center justify-between pt-1">
          <span className="font-medium text-ink">${product.price.toFixed(2)}</span>
          <span className="text-xs text-ink/50">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </span>
        </div>
      </div>
    </Link>
  );
}
