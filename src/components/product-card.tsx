import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  merchant: {
    name: string;
  };
  price: number;
  images: { url: string }[];
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images?.[0]?.url || "/placeholder-image.jpg";

  return (
    <Card>
      <Link href={`/marketplace/${product.id}`} passHref>
        <div className="cursor-pointer">
          <div className="aspect-square relative">
            <Image
              src={imageUrl}
              alt={product.name}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-semibold text-lg truncate">{product.name}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">{product.merchant.name}</p>
            <div className="flex items-center justify-between mt-4">
              <span className="font-bold text-xl">${product.price}</span>
              <Button size="sm">View</Button>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  );
}