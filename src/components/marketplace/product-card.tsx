
'use client'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Product } from "@/types"
import { formatCurrency } from "@/utils/formatting"
import Image from "next/image"
import Link from "next/link"
import { useCartStore } from "@/store/cart-store"
import { useToast } from "@/hooks/use-toast"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()
  const { toast } = useToast()

  const handleAddToCart = () => {
    addItem(product)
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    })
  }

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="p-0">
        <AspectRatio ratio={4 / 3}>
           <Image
            src={product.imageUrl || "/placeholder.svg"}
            alt={product.name}
            className="object-cover rounded-t-lg"
            fill
          />
        </AspectRatio>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <h3 className="text-lg font-semibold hover:text-primary transition-colors">
           <Link href={`/marketplace/${product.id}`}>
            {product.name}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground mt-1 h-10 overflow-hidden">
          {product.description}
        </p>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center">
        <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
        <Button onClick={handleAddToCart}>Add to Cart</Button>
      </CardFooter>
    </Card>
  )
}
