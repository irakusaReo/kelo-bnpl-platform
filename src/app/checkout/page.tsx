
'use client'

import PageHeader from "@/components/layout/page-header";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/utils/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCheckout } from "@/hooks/api/use-checkout";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const totalPrice = getTotalPrice();
  const shippingCost = totalPrice > 0 ? 5.00 : 0; // Example shipping cost
  const total = totalPrice + shippingCost;

  const { checkout, isLoading } = useCheckout();
  const { toast } = useToast();
  const router = useRouter();

  const handleCheckout = async () => {
    const orderDetails = {
      items: items.map(item => ({ productId: item.id, quantity: item.quantity, price: item.price })),
      totalAmount: total,
    };

    const success = await checkout(orderDetails);

    if (success) {
      toast({
        title: "Purchase Successful",
        description: "Your order has been placed and your loan application is being processed.",
      });
      clearCart();
      router.push('/dashboard/loans');
    } else {
      toast({
        title: "Purchase Failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Checkout"
        description="Complete your purchase by providing your shipping details."
      />
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <Card>
           <CardHeader>
            <CardTitle>Shipping Information</CardTitle>
          </CardHeader>
          <CardContent>
             <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first-name">First Name</Label>
                  <Input id="first-name" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last-name">Last Name</Label>
                  <Input id="last-name" placeholder="Doe" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main St" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" placeholder="Nairobi" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" placeholder="Kenya" />
              </div>
            </form>
          </CardContent>
        </Card>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <p className="text-muted-foreground">Your cart is empty.</p>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.name} x {item.quantity}</span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(totalPrice)}</span>
                  </div>
                   <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{formatCurrency(shippingCost)}</span>
                  </div>
                  <Separator />
                   <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          <Button
            className="w-full mt-6"
            size="lg"
            disabled={items.length === 0 || isLoading}
            onClick={handleCheckout}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm and Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
