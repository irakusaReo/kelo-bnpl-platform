"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductCard } from "@/components/marketplace/ProductCard";
import { useProducts } from "@/hooks/api/use-products";
import { Loader2 } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function MarketplacePage() {
  const { data: products, isLoading } = useProducts();

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader
        title="Marketplace"
        description="Browse products from our trusted merchants."
      />
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="electronics">Electronics</TabsTrigger>
          <TabsTrigger value="fashion">Fashion</TabsTrigger>
          <TabsTrigger value="home">Home Goods</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
