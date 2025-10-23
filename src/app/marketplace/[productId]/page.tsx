
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Product } from '@/types'
import { formatCurrency } from '@/utils/formatting'
import Image from 'next/image'
import { useCartStore } from '@/store/cart-store'
import { useToast } from '@/hooks/use-toast'
import PageHeader from '@/components/layout/page-header'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// This would typically be a hook: useProduct(productId)
const fetchProduct = async (productId: string): Promise<Product | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  // In a real app, you would fetch from `/api/products/${productId}`
  // For now, we'll just return a mock product.
  // This will be replaced when we wire up the dummy data.
  const mockProducts: Product[] = [
    { id: '1', name: 'Wireless Headphones', description: 'High-fidelity sound', price: 199.99, storeId: 'store-1', imageUrl: '/images/headphone.png' },
    { id: '2', name: 'Smartwatch', description: 'Track your fitness', price: 249.99, storeId: 'store-1', imageUrl: '/images/watch.png' },
    { id: '3', name: 'Laptop Pro', description: 'For professionals', price: 1299.99, storeId: 'store-2', imageUrl: '/images/laptop.png' },
  ];
  return mockProducts.find(p => p.id === productId) || null;
};


export default function ProductDetailPage({ params }: { params: { productId: string } }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCartStore();
  const { toast } = useToast();

  useEffect(() => {
    const loadProduct = async () => {
      setIsLoading(true);
      try {
        const data = await fetchProduct(params.productId);
        if(data) {
          setProduct(data);
        } else {
          setError("Product not found.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    loadProduct();
  }, [params.productId]);

  const handleAddToCart = () => {
    if (product) {
      addItem(product);
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!product) {
    return null; // Or a more specific "Not Found" component
  }

  return (
    <div className="container mx-auto px-4 py-8">
       <div className="grid md:grid-cols-2 gap-12 items-start">
        <div className="grid gap-4">
           <AspectRatio ratio={1 / 1} className="w-full">
            <Image
              src={product.imageUrl || "/placeholder.svg"}
              alt={product.name}
              className="object-cover rounded-lg"
              fill
            />
          </AspectRatio>
          {/* Add thumbnails here if needed */}
        </div>
        <div className="grid gap-4">
          <PageHeader title={product.name} />
          <p className="text-3xl font-bold">{formatCurrency(product.price)}</p>
          <div className="text-muted-foreground">
            <p>{product.description}</p>
          </div>
          <Button size="lg" onClick={handleAddToCart}>Add to Cart</Button>
          <div className="mt-4 prose">
            <h4>Product Details</h4>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
              euismod, nisl nec ultricies lacinia, nisl nisl aliquet
              aliquet, nec ultricies nisl nisl aliquet.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
