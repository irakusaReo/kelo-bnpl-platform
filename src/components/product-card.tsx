import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";
import { Product } from "@/types";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0] || "/placeholder-image.jpg";
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    addItem(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <Card className="overflow-hidden">
      <Link href={`/marketplace/${product.id}`} passHref>
        <div className="cursor-pointer group">
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={imageUrl}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{product.merchant_store.store_name}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="font-bold text-xl">${product.price}</span>
              <Button size="sm" onClick={handleAddToCart}>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}