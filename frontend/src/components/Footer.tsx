export default function Footer() {
  return (
    <footer className="border-t border-line py-10">
      <div className="mx-auto max-w-6xl px-6 text-xs text-ink/40">
        <p>Fieldmark — a demo storefront for a 12-service Istio mesh backend.</p>
        <p className="mt-1">
          Every page here calls a different backend service through one ingress gateway —
          catalog, search, recommendation, cart, wishlist, user, and order-taking/processing.
        </p>
      </div>
    </footer>
  );
}
