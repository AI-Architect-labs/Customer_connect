'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CART_STORAGE_KEY } from '@/config/app';
import type { Product } from '@/types/product';
export interface CartItem {
  productId: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  unit: string;
  packSize: number;
  price: number;
  qty: number;
  availabilityStatus: string;
}
interface CartState {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  totalItems: () => number;
  subtotal: () => number;
}
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (p, qty = 1) =>
        set((state) => {
          const found = state.items.find((i) => i.productId === p.id);
          if (found)
            return {
              items: state.items.map((i) =>
                i.productId === p.id ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          const cover = p.images.find((i) => i.isCover) ?? p.images[0];
          return {
            items: [
              ...state.items,
              {
                productId: p.id,
                name: p.name,
                brand: p.brand,
                imageUrl: cover?.url,
                unit: p.unit,
                packSize: p.packSize,
                price: p.discountPrice ?? p.mrp,
                qty,
                availabilityStatus: p.availabilityStatus,
              },
            ],
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
      setQty: (id, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.productId !== id)
              : s.items.map((i) => (i.productId === id ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
    }),
    { name: CART_STORAGE_KEY },
  ),
);
