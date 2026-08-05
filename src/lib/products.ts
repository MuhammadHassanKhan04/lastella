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
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return (data as any[]).map(mapProduct) as Product[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) throw new Error("Failed to fetch product");
      const data = await res.json();
      const product = Array.isArray(data) ? data[0] : data;
      if (!product) throw new Error("Product not found");
      return mapProduct(product) as Product & { description?: string };
    },
    enabled: !!slug,
  });
}
