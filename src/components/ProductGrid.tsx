import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/lib/store";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  products: Product[];
}

export function ProductGrid({ eyebrow, title, subtitle, products }: Props) {
  const { t } = useI18n();
  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-end justify-between mb-10 gap-6 flex-wrap">
        <div>
          {eyebrow && <p className="text-xs uppercase tracking-[0.35em] text-primary font-medium mb-3">{eyebrow}</p>}
          <h2 className="font-display text-4xl sm:text-5xl">{title}</h2>
          {subtitle && <p className="mt-3 text-muted-foreground max-w-xl">{subtitle}</p>}
        </div>
        <Link to="/shop" className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          {t("product.viewAll")}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
