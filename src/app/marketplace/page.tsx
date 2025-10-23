
'use client'

import PageHeader from "@/components/layout/page-header";
import { ProductCard } from "@/components/marketplace/product-card";
import { useProducts } from "@/hooks/api/use-products";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Product } from "@/types";

export default function MarketplacePage() {
  const { data: products, isLoading, error } = useProducts();

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Marketplace"
        description="Browse products from our trusted merchants."
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-4 text-muted-foreground">Loading products...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch products. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {products && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
