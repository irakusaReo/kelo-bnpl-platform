'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

type PaymentPlan = 'pay-in-30' | 'pay-in-4' | 'pay-monthly';

const CheckoutPage = () => {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [selectedPlan, setSelectedPlan] = useState<PaymentPlan>('pay-in-4');
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const totalPrice = getTotalPrice();
  const payIn4Amount = (totalPrice / 4).toFixed(2);

  const handleConfirmPurchase = async () => {
    setIsProcessing(true);

    const orderPayload = {
      // The backend will determine the merchant store ID from the products
      items: items.map(item => ({
        productId: item.id,
        quantity: item.quantity,
      })),
      // We can also send the selected payment plan to the backend
      paymentPlan: selectedPlan,
    };

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order.');
      }

      toast.success('Your order has been placed successfully!');
      clearCart();
      router.push('/dashboard'); // Redirect to a relevant page

    } catch (error: any) {
      console.error('Failed to create order:', error);
      toast.error(error.message || 'An unexpected error occurred.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0 && !isProcessing) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h1 className="text-2xl">Your cart is empty.</h1>
        <p className="mt-2">You can't proceed to checkout without any items.</p>
        <Link href="/marketplace">
          <Button className="mt-6">Go Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h2 className="text-xl font-semibold mb-4">Choose your payment plan</h2>
          <RadioGroup value={selectedPlan} onValueChange={(val) => setSelectedPlan(val as PaymentPlan)} className="space-y-4">
            <Label htmlFor="pay-in-30" className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-blue-500">
              <RadioGroupItem value="pay-in-30" id="pay-in-30" className="mr-4" />
              <div className="flex-grow">
                <span className="font-semibold">Pay in 30 Days</span>
                <p className="text-sm text-gray-500">Pay the full amount of ${totalPrice.toFixed(2)} in 30 days. Interest-free.</p>
              </div>
            </Label>
             <Label htmlFor="pay-in-4" className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-blue-500">
              <RadioGroupItem value="pay-in-4" id="pay-in-4" className="mr-4" />
              <div className="flex-grow">
                <span className="font-semibold">Pay in 4</span>
                <p className="text-sm text-gray-500">4 interest-free installments of ${payIn4Amount} every 30 days.</p>
              </div>
            </Label>
             <Label htmlFor="pay-monthly" className="flex items-center p-4 border rounded-lg cursor-pointer hover:border-blue-500">
              <RadioGroupItem value="pay-monthly" id="pay-monthly" className="mr-4" />
              <div className="flex-grow">
                <span className="font-semibold">Pay Monthly</span>
                <p className="text-sm text-gray-500">Longer-term plan for larger purchases. Interest applies.</p>
              </div>
            </Label>
          </RadioGroup>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.name} x {item.quantity}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <Button
                className="w-full mt-6 text-lg"
                onClick={handleConfirmPurchase}
                disabled={isProcessing || items.length === 0}
              >
                {isProcessing ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
