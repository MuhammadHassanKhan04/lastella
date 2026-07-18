import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { ProductGrid } from "@/components/ProductGrid";
import { FlashSale } from "@/components/FlashSale";
import { Testimonials } from "@/components/Testimonials";
import { useProducts } from "@/lib/products";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { t } = useI18n();
  const { data: products = [], isLoading } = useProducts();

  return (
    <>
      <Hero />
      <Categories />
      <ProductGrid
        eyebrow={t("section.trending.eyebrow")}
        title={t("section.trending.title")}
        subtitle={t("section.trending.subtitle")}
        products={products.slice(0, 4)}
        isLoading={isLoading}
      />
      <FlashSale />
      <ProductGrid
        title={t("section.bestsellers.title")}
        products={products.slice(4, 8)}
        isLoading={isLoading}
      />
      <Testimonials />
    </>
  );
}
