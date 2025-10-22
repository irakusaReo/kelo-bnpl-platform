"use client";

import { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/store/cart-store";
import { useToast } from "@/hooks/use-toast";

interface ProductDetailsProps {
  product: Product;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const { addItem } = useCartStore();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="text-xl text-muted-foreground">
        {product.merchant_stores.name}
      </p>
      <p className="text-3xl font-bold">
        KSH {product.price.toLocaleString()}
      </p>
      <Separator />
      <p className="text-muted-foreground">{product.description}</p>
      <Button size="lg" onClick={handleAddToCart}>
        Add to Cart
      </Button>
    </div>
  );
}
