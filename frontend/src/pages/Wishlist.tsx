import { useQuery } from "@tanstack/react-query";
import { wishlistApi, catalogApi } from "../api/client";
import ProductCard from "../components/ProductCard";
import { Loading, ErrorState, EmptyState } from "../components/States";

export default function Wishlist() {
  const { data: wishlist, isLoading, isError } = useQuery({
    queryKey: ["wishlist"],
    queryFn: () => wishlistApi.get(),
  });
  const { data: catalog } = useQuery({ queryKey: ["catalog"], queryFn: () => catalogApi.list() });

  if (isLoading) return <Loading label="Loading wishlist" />;
  if (isError || !wishlist) return <ErrorState message="wishlist-service didn't respond." />;

  const products = (catalog?.products ?? []).filter((p) => wishlist.products.includes(p.id));

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="mb-8 font-display text-3xl font-semibold text-ink">Your wishlist</h1>
      {products.length === 0 ? (
        <EmptyState title="Nothing saved yet" body="Items you save for later will show up here." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
