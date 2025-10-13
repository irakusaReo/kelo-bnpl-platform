'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const CartPage = () => {
  const { items, removeItem, updateItemQuantity, getTotalPrice, clearCart } = useCartStore();

  const handleQuantityChange = (productId: string, quantity: number) => {
    if (quantity > 0) {
      updateItemQuantity(productId, quantity);
    }
  };

  const handleRemoveItem = (productId: string, productName: string) => {
    removeItem(productId);
    toast.info(`${productName} has been removed from your cart.`);
  };

  const totalPrice = getTotalPrice();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <Link href="/marketplace" className="text-blue-600 hover:underline flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Continue Shopping
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-xl text-gray-600">Your cart is empty.</p>
          <p className="mt-2">Looks like you haven’t added anything to your cart yet.</p>
          <Link href="/marketplace">
            <Button className="mt-6">Shop Now</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="relative h-20 w-20 bg-gray-100 rounded-md overflow-hidden">
                    <Image src="/placeholder-image.jpg" alt={item.name} layout="fill" objectFit="cover" />
                  </div>
                  <div>
                    <h2 className="font-semibold">{item.name}</h2>
                    <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value, 10))}
                    className="w-20"
                  />
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id, item.name)}>
                    <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
             <Button variant="outline" onClick={clearCart} className="mt-4">Clear Cart</Button>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg h-fit">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            <div className="flex justify-between mb-2">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="border-t my-4"></div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <Link href="/checkout">
              <Button className="w-full mt-6 text-lg">
                Proceed to Checkout
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
