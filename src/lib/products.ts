import { useQuery } from "@tanstack/react-query";
import type { Product } from "./store";

function mapProduct(d: any): Product {
  return {
    id: d.id || d._id,
    slug: d.slug,
    name: { en: d.name_en, ar: d.name_ar ?? "" },
    category: d.category,
    price: Number(d.price),
    oldPrice: d.old_price ? Number(d.old_price) : undefined,
    image: d.image,
    rating: Number(d.rating || 0),
    reviews: Number(d.reviews || 0),
    badge: d.badge || undefined,
    stock: Number(d.stock || 0),
    description: d.description_en || undefined,
    images: d.images || [],
    sizes: d.sizes || [],
    colors: d.colors || [],
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      try {
        const url = typeof window !== "undefined" 
          ? "/api/products" 
          : `https://${process.env.VERCEL_URL || "localhost:3000"}/api/products`;
        
        const res = await fetch(url).catch(() => null);
        if (!res || !res.ok) return [];
        const data = await res.json();
        if (!Array.isArray(data)) return [];
        return data.map(mapProduct) as Product[];
      } catch (e) {
        console.error("Error fetching products:", e);
        return [];
      }
    },
    retry: 1,
    staleTime: 1000 * 60 * 5,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      try {
        const url = typeof window !== "undefined"
          ? `/api/products?slug=${encodeURIComponent(slug)}`
          : `https://${process.env.VERCEL_URL || "localhost:3000"}/api/products?slug=${encodeURIComponent(slug)}`;
        
        const res = await fetch(url).catch(() => null);
        if (!res || !res.ok) return null;
        const data = await res.json();
        const product = Array.isArray(data) ? data[0] : data;
        if (!product) return null;
        return mapProduct(product) as Product & { description?: string };
      } catch (e) {
        console.error("Error fetching product:", e);
        return null;
      }
    },
    enabled: !!slug,
    retry: 1,
  });
}
