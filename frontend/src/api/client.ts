import axios from "axios";

// Points at the Istio ingress gateway. Set VITE_API_BASE_URL at build/deploy time
// (see .env.example) — defaults to same-origin, which is correct once the frontend
// itself is served through the same gateway.
const BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 8000,
});

// Demo identity — the backend services key everything off a fixed seed user
// (u-100) and product catalog. A real app would derive this from an auth layer.
export const CURRENT_USER_ID = "u-100";

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  catalog_release?: string;
  version?: string;
}

export interface CartItem {
  product_id: string;
  quantity: number;
}

export interface CartResponse {
  user_id: string;
  items: CartItem[];
  item_count: number;
}

export interface WishlistResponse {
  user_id: string;
  products: string[];
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  tier: string;
}

export interface OrderResponse {
  order_id: string;
  status: string;
  customer: UserProfile;
  cart: CartResponse;
  processing: {
    order_id: string;
    status: string;
    payment: { authorized: boolean; provider: string };
    inventory: { product_id: string; warehouse: string; available: number; reserved: number };
    shipping: { carrier: string; status: string };
    notification: { channel: string; queued: boolean };
  };
}

export interface RecommendationsResponse {
  user_id: string;
  strategy: string;
  recommendations: Product[];
}

// --- catalog-service ---
export const catalogApi = {
  list: (q = "") =>
    api.get<{ products: Product[]; catalog_release: string; version: string }>(
      "/catalog/products",
      { params: q ? { q } : {} }
    ).then((r) => r.data),
  get: (id: string) =>
    api.get<Product & { catalog_release: string; version: string }>(
      `/catalog/products/${id}`
    ).then((r) => r.data),
};

// --- search-service ---
export const searchApi = {
  search: (q: string) =>
    api.get<{ query: string; results: Product[] }>("/search", { params: { q } }).then((r) => r.data),
};

// --- recommendation-service ---
export const recommendationApi = {
  forUser: (userId = CURRENT_USER_ID) =>
    api.get<RecommendationsResponse>(`/recommendations/${userId}`).then((r) => r.data),
};

// --- cart-service ---
export const cartApi = {
  get: (userId = CURRENT_USER_ID) =>
    api.get<CartResponse>(`/cart/${userId}`).then((r) => r.data),
  addItem: (productId: string, userId = CURRENT_USER_ID) =>
    api.post<CartResponse>(`/cart/${userId}/items/${productId}`).then((r) => r.data),
};

// --- wishlist-service ---
export const wishlistApi = {
  get: (userId = CURRENT_USER_ID) =>
    api.get<WishlistResponse>(`/wishlist/${userId}`).then((r) => r.data),
};

// --- user-service ---
export const userApi = {
  get: (userId = CURRENT_USER_ID) =>
    api.get<UserProfile>(`/users/${userId}`).then((r) => r.data),
};

// --- order-taking-service / order-processing-service ---
export const orderApi = {
  place: (userId = CURRENT_USER_ID) =>
    api.post<OrderResponse>("/orders", null, { params: { user_id: userId } }).then((r) => r.data),
};
