"use client";

import { Product } from "@/types";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="overflow-hidden">
        <Link href={`/marketplace/${product.id}`}>
      <CardHeader className="p-0">
          <AspectRatio ratio={4 / 3}>
            <Image
              src={product.imageUrl || "/placeholder.svg"}
              alt={product.name}
              className="object-cover"
              fill
            />
          </AspectRatio>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-lg font-semibold hover:text-primary transition-colors">
            {product.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          {product.merchant_stores.name}
        </p>
      </CardContent>
        </Link>
      <CardFooter className="p-4 pt-0">
        <div className="flex items-center justify-between w-full">
            <p className="text-lg font-bold">
                KSH {product.price.toLocaleString()}
            </p>
          <Button>Add to Cart</Button>
        </div>
      </CardFooter>
    </Card>
  );
}
