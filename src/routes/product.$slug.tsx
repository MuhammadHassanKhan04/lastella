import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { Heart, Minus, Plus, ShoppingBag, Shield, Truck, RotateCcw, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useProducts } from "@/lib/products";
import { useI18n } from "@/lib/i18n";
import { useStore, type Product } from "@/lib/store";
import { formatPrice } from "@/lib/currency";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", params.slug)
      .eq("active", true)
      .single();

    if (error || !data) throw notFound();

    const product = {
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

    return { product };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.product.name.en ?? "Product"} · Lastella` },
      { name: "description", content: `Discover the ${loaderData?.product.name.en} — a Lastella luxury piece.` },
      { property: "og:title", content: `${loaderData?.product.name.en} · Lastella` },
      { property: "og:description", content: "Big brand elegance. Small brand prices." },
      { property: "og:image", content: loaderData?.product.image },
    ],
  }),
  component: ProductPage,
  notFoundComponent: () => <div className="p-20 text-center">Product not found.</div>,
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { t, lang } = useI18n();
  const { addToCart, toggleWishlist, wishlist } = useStore();
  const [qty, setQty] = useState(1);
  const wished = wishlist.includes(product.id);
  
  const { data: allProducts = [] } = useProducts();
  const related = allProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
      <nav className="text-xs text-muted-foreground mb-8">
        <Link to="/" className="hover:text-primary">{t("nav.home")}</Link> / <Link to="/shop" className="hover:text-primary">{t("nav.shop")}</Link> / <span className="text-foreground">{product.name[lang]}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-3xl bg-secondary">
            <img src={product.image} alt={product.name[lang]} className="h-full w-full object-cover" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[product.image, product.image, product.image, product.image].map((img, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-xl bg-secondary ring-1 ring-transparent hover:ring-primary cursor-pointer transition-all">
                <img src={img} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-3">{t(`cat.${product.category}` as never)}</p>
          <h1 className="font-display text-4xl sm:text-5xl leading-tight">{product.name[lang]}</h1>
          <div className="flex items-center gap-2 mt-4 text-sm">
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`h-4 w-4 ${i < Math.round(product.rating) ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />
              ))}
            </div>
            <span className="text-muted-foreground">{product.rating} · {product.reviews} reviews</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3 flex-wrap">
            <span className="font-display text-4xl">{formatPrice(product.price)}</span>
            {product.oldPrice && <span className="text-lg text-muted-foreground line-through">{formatPrice(product.oldPrice)}</span>}
          </div>

          <p className="mt-6 text-foreground/75 leading-relaxed">
            {product.description || "Handcrafted with 18k rose-gold plating and ethically-sourced stones. Each piece is finished with a signature Lastella hallmark and packaged in our pink velvet keepsake case — designed to be worn every day, treasured for a lifetime."}
          </p>

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3">Material</p>
              <div className="flex gap-2">
                {["Rose Gold", "Silver", "Yellow Gold"].map((m, i) => (
                  <button key={m} className={`rounded-full px-4 py-2 text-sm border transition-all ${i === 0 ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary"}`}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-3">Size</p>
              <div className="flex gap-2">
                {["S", "M", "L"].map((s, i) => (
                  <button key={s} className={`h-11 w-11 rounded-full text-sm border transition-all ${i === 1 ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center rounded-full border border-border">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="p-3 hover:text-primary" aria-label="Decrease"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="p-3 hover:text-primary" aria-label="Increase"><Plus className="h-4 w-4" /></button>
            </div>
            <button
              onClick={() => { addToCart(product, qty); toast.success(`${product.name[lang]} added to cart`); }}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] luxury-shadow hover:bg-rose-deep transition-all"
            >
              <ShoppingBag className="h-4 w-4" /> {t("product.addToCart")}
            </button>
            <button
              onClick={() => toggleWishlist(product.id)}
              className="grid place-items-center h-14 w-14 rounded-full border border-border hover:border-primary hover:text-primary transition-all"
              aria-label="Wishlist"
            >
              <Heart className={`h-5 w-5 ${wished ? "fill-primary text-primary" : ""}`} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            {[
              { Icon: Truck, label: t("common.free_shipping") },
              { Icon: Shield, label: t("common.lifetime") },
              { Icon: RotateCcw, label: t("common.returns") },
            ].map(({ Icon, label }, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-secondary/50">
                <Icon className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-3xl mb-8">{lang === "ar" ? "قد يعجبك أيضًا" : "You may also love"}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
