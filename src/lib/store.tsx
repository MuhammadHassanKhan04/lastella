import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface Product {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  badge?: "new" | "sale" | "bestseller";
  stock: number;
}

export interface CartItem { product: Product; qty: number; }

interface StoreCtx {
  cart: CartItem[];
  wishlist: string[];
  addToCart: (p: Product, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  toggleWishlist: (id: string) => void;
  cartCount: number;
  cartTotal: number;
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);

  useEffect(() => {
    try {
      const c = localStorage.getItem("lastella-cart");
      const w = localStorage.getItem("lastella-wishlist");
      if (c) setCart(JSON.parse(c));
      if (w) setWishlist(JSON.parse(w));
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem("lastella-cart", JSON.stringify(cart)); } catch {} }, [cart]);
  useEffect(() => { try { localStorage.setItem("lastella-wishlist", JSON.stringify(wishlist)); } catch {} }, [wishlist]);

  const value = useMemo<StoreCtx>(() => ({
    cart, wishlist,
    addToCart: (p, qty = 1) => setCart((c) => {
      const ex = c.find((i) => i.product.id === p.id);
      if (ex) return c.map((i) => i.product.id === p.id ? { ...i, qty: i.qty + qty } : i);
      return [...c, { product: p, qty }];
    }),
    removeFromCart: (id) => setCart((c) => c.filter((i) => i.product.id !== id)),
    updateQty: (id, qty) => setCart((c) => qty <= 0 ? c.filter((i) => i.product.id !== id) : c.map((i) => i.product.id === id ? { ...i, qty } : i)),
    toggleWishlist: (id) => setWishlist((w) => w.includes(id) ? w.filter((x) => x !== id) : [...w, id]),
    cartCount: cart.reduce((s, i) => s + i.qty, 0),
    cartTotal: cart.reduce((s, i) => s + i.qty * i.product.price, 0),
  }), [cart, wishlist]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be inside StoreProvider");
  return c;
}
