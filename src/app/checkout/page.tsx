
'use client'

import PageHeader from "@/components/layout/page-header";
import { useCartStore } from "@/store/cart-store";
import { formatCurrency } from "@/utils/formatting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckoutPage() {
  const { items, getTotalPrice } = useCartStore();
  const totalPrice = getTotalPrice();
  const shippingCost = totalPrice > 0 ? 5.00 : 0; // Example shipping cost
  const total = totalPrice + shippingCost;

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader
        title="Checkout"
        description="Complete your purchase."
      />
      <div className="grid md:grid-cols-2 gap-12 items-start">
        <div>
          <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
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
        </div>
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
          <Button className="w-full mt-6" size="lg" disabled={items.length === 0}>
            Confirm and Pay
          </Button>
        </div>
      </div>
    </div>
  );
}
