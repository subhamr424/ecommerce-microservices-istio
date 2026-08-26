import { Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders/:orderId/confirmation" element={<OrderConfirmation />} />
          <Route
            path="*"
            element={
              <div className="mx-auto max-w-xl px-6 py-24 text-center">
                <p className="font-display text-2xl font-semibold text-ink">Page not found</p>
                <p className="mt-2 text-sm text-ink/60">That route doesn't exist in this storefront.</p>
              </div>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
