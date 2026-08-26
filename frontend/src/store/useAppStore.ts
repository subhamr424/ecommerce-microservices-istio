import { create } from "zustand";

interface AppState {
  cartCount: number;
  setCartCount: (n: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  cartCount: 0,
  setCartCount: (n) => set({ cartCount: n }),
}));
