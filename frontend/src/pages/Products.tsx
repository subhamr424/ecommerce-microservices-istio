import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { catalogApi, searchApi, Product } from "../api/client";
import ProductCard from "../components/ProductCard";
import { Loading, ErrorState, EmptyState } from "../components/States";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";

  const query = useQuery<Product[]>({
    queryKey: ["products", q],
    queryFn: async () => {
      if (q) {
        const res = await searchApi.search(q);
        return res.results;
      }
      const res = await catalogApi.list();
      return res.products;
    },
  });

  const products = query.data ?? [];
  const filtered = category ? products.filter((p) => p.category === category) : products;

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            {q ? `Results for "${q}"` : "Shop the catalog"}
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            {q ? "via search-service" : "via catalog-service"}
            {category && ` · filtered to ${category}`}
          </p>
        </div>
        {(q || category) && (
          <button
            onClick={() => setParams({})}
            className="rounded-full border border-line px-4 py-2 text-sm font-medium text-ink/70 hover:border-moss-500 hover:text-ink"
          >
            Clear filters
          </button>
        )}
      </div>

      {query.isLoading && <Loading label="Searching" />}
      {query.isError && <ErrorState message="search-service or catalog-service didn't respond." />}
      {query.data && filtered.length === 0 && (
        <EmptyState title="Nothing here" body="Try a different search term or clear your filters." />
      )}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
