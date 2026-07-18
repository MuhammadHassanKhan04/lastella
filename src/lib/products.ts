import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product } from "./store";
import p1 from "@/assets/prod-1.jpg";
import p2 from "@/assets/prod-2.jpg";
import p3 from "@/assets/prod-3.jpg";
import p4 from "@/assets/prod-4.jpg";
import p5 from "@/assets/prod-5.jpg";
import p7 from "@/assets/prod-7.jpg";
import p8 from "@/assets/prod-8.jpg";
import cn from "@/assets/cat-necklace.jpg";

const DEFAULT_PRODUCTS: Product[] = [
  { id: "1", slug: "etoile-rose-necklace", name: { en: "Étoile Rose Necklace", ar: "عقد إتوال الوردي" }, category: "necklace", price: 36000, oldPrice: 52900, image: p1, rating: 4.9, reviews: 214, badge: "bestseller", stock: 12 },
  { id: "2", slug: "celestine-diamond-studs", name: { en: "Celestine Diamond Studs", ar: "أقراط سيليستين الألماس" }, category: "earrings", price: 24900, oldPrice: 36000, image: p2, rating: 4.8, reviews: 187, badge: "sale", stock: 30 },
  { id: "3", slug: "aurore-gemstone-bangle", name: { en: "Aurore Gemstone Bangle", ar: "سوار أورور المرصع" }, category: "bracelet", price: 61300, image: p3, rating: 4.9, reviews: 92, badge: "new", stock: 8 },
  { id: "4", slug: "solitaire-rose-ring", name: { en: "Solitaire Rose Ring", ar: "خاتم سوليتير الوردي" }, category: "ring", price: 97700, oldPrice: 139700, image: p4, rating: 5.0, reviews: 341, badge: "bestseller", stock: 5 },
  { id: "5", slug: "perle-blush-pendant", name: { en: "Perle Blush Pendant", ar: "دلاية بيرل الوردية" }, category: "pendant", price: 22100, image: p5, rating: 4.7, reviews: 156, badge: "new", stock: 22 },
  { id: "6", slug: "swan-heart-necklace", name: { en: "Swan Heart Necklace", ar: "عقد سوان القلب" }, category: "necklace", price: 27700, oldPrice: 41700, image: cn, rating: 4.9, reviews: 428, badge: "sale", stock: 18 },
  { id: "7", slug: "lumiere-diamond-watch", name: { en: "Lumière Diamond Watch", ar: "ساعة لوميير الألماس" }, category: "watch", price: 128500, image: p7, rating: 4.8, reviews: 74, stock: 4 },
  { id: "8", slug: "amour-heart-pendant", name: { en: "Amour Heart Pendant", ar: "دلاية أمور القلب" }, category: "pendant", price: 41700, oldPrice: 55700, image: p8, rating: 4.9, reviews: 263, badge: "sale", stock: 15 },
];

const STORAGE_KEY = "lastella_products";

export function getLocalProducts(): Product[] {
  if (typeof window === "undefined") return DEFAULT_PRODUCTS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return DEFAULT_PRODUCTS;
    }
  }
  // Initialize storage
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PRODUCTS));
  return DEFAULT_PRODUCTS;
}

export function saveLocalProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      // simulate network delay for smooth skeleton rendering
      await new Promise(r => setTimeout(r, 400));
      return getLocalProducts();
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 300));
      const products = getLocalProducts();
      const product = products.find(p => p.slug === slug);
      if (!product) throw new Error("Product not found");
      return product;
    },
    enabled: !!slug
  });
}

export function useAdminProducts() {
  const queryClient = useQueryClient();
  
  const addOrUpdate = useMutation({
    mutationFn: async (product: Product) => {
      const products = getLocalProducts();
      const idx = products.findIndex(p => p.id === product.id);
      if (idx >= 0) products[idx] = product;
      else products.unshift(product); // Add to top
      saveLocalProducts(products);
      return product;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] })
  });
  
  const remove = useMutation({
    mutationFn: async (id: string) => {
      const products = getLocalProducts().filter(p => p.id !== id);
      saveLocalProducts(products);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["products"] })
  });

  return { addOrUpdate, remove };
}
