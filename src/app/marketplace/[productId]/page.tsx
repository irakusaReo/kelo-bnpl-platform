"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Product } from "@/types";
import { useCartStore } from "@/store/cart-store";
import { toast } from "sonner";

export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addItem } = useCartStore();

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
      toast.success(`${product.name} has been added to your cart.`);
    }
  };

  useEffect(() => {
    if (params.productId) {
      const fetchProduct = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/products/${params.productId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch product");
          }
          const data = await response.json();
          setProduct(data);
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [params.productId]);

  if (isLoading) {
    return (
        <div className="min-h-screen bg-white dark:bg-black p-8">
            <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-8 w-8" />
                        <div className="flex items-center space-x-2">
                            <Skeleton className="h-8 w-8" />
                            <Skeleton className="h-8 w-8" />
                        </div>
                    </div>
                </div>
            </header>
            <main className="container mx-auto px-4 py-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <Skeleton className="h-96 w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-12 w-full mt-auto" />
                    </div>
                </div>
            </main>
        </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  if (!product) {
    return <div className="text-center py-10">Product not found.</div>;
  }

  const installmentAmount = (product.price / 4).toFixed(2);
  const productImages = product.images?.length > 0 ? product.images : [{ url: "/placeholder-image.jpg" }];

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/marketplace" passHref>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Link href="/cart" passHref>
                <Button variant="ghost" size="icon">
                  <ShoppingCart className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/profile" passHref>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Carousel className="w-full">
              <CarouselContent>
                {productImages.map((image, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square relative bg-gray-100 dark:bg-gray-800 rounded-lg">
                      <Image
                        src={image.url}
                        alt={`${product.name} image ${index + 1}`}
                        layout="fill"
                        objectFit="contain"
                        className="rounded-lg"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </div>

          <div className="flex flex-col">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">{product.merchant.name}</p>

            <Separator className="my-4" />

            <h2 className="text-xl font-semibold mb-2">Product info</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{product.description}</p>


            <div className="mt-auto pt-8">
              <Button size="lg" className="w-full text-lg" onClick={handleAddToCart}>
                Add to Cart <span className="font-bold ml-4">${product.price}</span>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}