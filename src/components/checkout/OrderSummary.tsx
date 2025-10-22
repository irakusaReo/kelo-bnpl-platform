"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart-store";
import { useCheckout } from "@/hooks/api/use-checkout";
import { Loader2 } from "lucide-react";

export function OrderSummary() {
  const { items, getTotalPrice } = useCartStore();
  const { mutate: checkout, isLoading } = useCheckout();
  const totalPrice = getTotalPrice();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.name} x {item.quantity}
              </span>
              <span>
                KSH {(item.price * item.quantity).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>KSH {totalPrice.toLocaleString()}</span>
        </div>
        <Button
          className="w-full mt-6 text-lg"
          onClick={() => checkout()}
          disabled={isLoading || items.length === 0}
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Confirm Purchase"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
