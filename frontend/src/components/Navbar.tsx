import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { cartApi, wishlistApi } from "../api/client";

export default function Navbar() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");

  const { data: cart } = useQuery({ queryKey: ["cart"], queryFn: () => cartApi.get() });
  const { data: wishlist } = useQuery({ queryKey: ["wishlist"], queryFn: () => wishlistApi.get() });

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) navigate(`/products?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-4">
        <Link to="/" className="font-display text-xl font-semibold tracking-tight text-ink">
          Fieldmark
        </Link>

        <nav className="hidden gap-5 text-sm font-medium text-ink/70 md:flex">
          <Link to="/products" className="hover:text-ink">Shop</Link>
          <Link to="/products?category=shoes" className="hover:text-ink">Footwear</Link>
          <Link to="/products?category=apparel" className="hover:text-ink">Apparel</Link>
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden max-w-xs flex-1 md:block">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="search"
            placeholder="Search the catalog"
            className="w-full rounded-full border border-line bg-white/60 px-4 py-2 text-sm outline-none placeholder:text-ink/40 focus:border-moss-500"
          />
        </form>

        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <Link to="/wishlist" className="relative text-ink/70 hover:text-ink" aria-label="Wishlist">
            <HeartIcon />
            {(wishlist?.products.length ?? 0) > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[10px] font-semibold text-white">
                {wishlist!.products.length}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative text-ink/70 hover:text-ink" aria-label="Cart">
            <BagIcon />
            {(cart?.item_count ?? 0) > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-moss-600 text-[10px] font-semibold text-white">
                {cart!.item_count}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M20.8 8.6c0 4.3-8.8 10.4-8.8 10.4S3.2 12.9 3.2 8.6a4.6 4.6 0 0 1 8.8-2 4.6 4.6 0 0 1 8.8 2Z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M6 8h12l1 12H5L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
