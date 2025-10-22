"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { useCartStore } from "@/store/cart-store";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const { items } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6 text-center">
        <PageHeader
          title="Checkout"
          description="Your cart is empty."
        />
        <Link href="/marketplace">
            <Button>
                Go Shopping
            </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader
        title="Checkout"
        description="Complete your purchase by selecting a payment plan."
      />
      <div className="grid md:grid-cols-2 gap-8">
        <CheckoutForm />
        <OrderSummary />
      </div>
    </div>
  );
}
