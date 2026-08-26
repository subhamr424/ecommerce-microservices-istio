import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { catalogApi, recommendationApi } from "../api/client";
import ProductCard from "../components/ProductCard";
import { Loading, ErrorState } from "../components/States";

export default function Home() {
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => catalogApi.list() });
  const recs = useQuery({ queryKey: ["recommendations"], queryFn: () => recommendationApi.forUser() });

  return (
    <div>
      <section className="border-b border-line bg-moss-900 text-canvas">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-moss-300">
              {catalog.data?.catalog_release ?? "New season"}
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight">
              Gear that holds up<br />past the first mile.
            </h1>
            <p className="mt-5 max-w-md text-moss-100/80">
              Runners, totes, and everyday layers, tested past their warranty. No
              seasonal drops, no gimmicks — just the pieces we'd re-buy ourselves.
            </p>
            <Link
              to="/products"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-canvas px-6 py-3 text-sm font-semibold text-ink transition hover:bg-moss-100"
            >
              Shop the catalog →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {(catalog.data?.products ?? []).slice(0, 4).map((p, i) => (
              <div
                key={p.id}
                className={`flex h-32 items-center justify-center rounded-2xl font-display text-2xl font-semibold text-white/90 ${
                  i % 2 === 0 ? "bg-moss-600" : "bg-rust"
                } ${i > 2 ? "col-span-2" : ""}`}
              >
                {p.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink">Full catalog</h2>
          <Link to="/products" className="text-sm font-medium text-moss-700 hover:underline">
            View all
          </Link>
        </div>
        {catalog.isLoading && <Loading label="Loading catalog" />}
        {catalog.isError && <ErrorState message="catalog-service didn't respond in time." />}
        {catalog.data && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(catalog.data?.products ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {recs.data && (recs.data?.recommendations ?? []).length > 0 && (
        <section className="border-t border-line bg-moss-50">
          <div className="mx-auto max-w-6xl px-6 py-14">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.15em] text-moss-600">
              {recs.data.strategy.replace("-", " ")}
            </p>
            <h2 className="mb-6 font-display text-2xl font-semibold text-ink">Recommended for you</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {(recs.data?.recommendations ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
