import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "./store";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data || []).map((d: any) => ({
        id: d.id,
        slug: d.slug,
        name: { en: d.name_en, ar: d.name_ar ?? "" },
        category: d.category,
        price: Number(d.price),
        oldPrice: d.old_price ? Number(d.old_price) : undefined,
        image: d.image,
        rating: Number(d.rating),
        reviews: Number(d.reviews),
        badge: d.badge || undefined,
        stock: Number(d.stock),
        description: d.description_en || undefined
      })) as Product[];
    },
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("active", true)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        slug: data.slug,
        name: { en: data.name_en, ar: data.name_ar ?? "" },
        category: data.category,
        price: Number(data.price),
        oldPrice: data.old_price ? Number(data.old_price) : undefined,
        image: data.image,
        rating: Number(data.rating),
        reviews: Number(data.reviews),
        badge: data.badge || undefined,
        stock: Number(data.stock),
        description: data.description_en || undefined
      } as Product & { description?: string };
    },
    enabled: !!slug
  });
}
