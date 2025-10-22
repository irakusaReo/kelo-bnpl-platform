"use client";

import { useProduct } from "@/hooks/api/use-product";
import { Loader2 } from "lucide-react";
import { ProductImageGallery } from "@/components/marketplace/ProductImageGallery";
import { ProductDetails } from "@/components/marketplace/ProductDetails";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ProductDetailPage({
  params,
}: {
  params: { productId: string };
}) {
  const { data: product, isLoading } = useProduct(params.productId);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
        <Link href="/marketplace">
            <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Marketplace
            </Button>
        </Link>
      {isLoading ? (
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : product ? (
        <div className="grid md:grid-cols-2 gap-8">
          <ProductImageGallery images={product.images} />
          <ProductDetails product={product} />
        </div>
      ) : (
        <p>Product not found.</p>
      )}
    </div>
  );
}
