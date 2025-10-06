"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@/contexts/UserContext";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
}

const mockAddress = {
  line1: "10466 Talbot Lane",
  city: "Bronx, NY",
};

const STEPS = {
  DELIVERY: "delivery",
  PAYMENT: "payment",
  CONFIRMATION: "confirmation",
};

function CheckoutFlow() {
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");
  const { user } = useUser();
  const { toast } = useToast();

  const [step, setStep] = useState(STEPS.DELIVERY);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState("split_pay");
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productId) {
      const fetchProduct = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/products/${productId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch product details");
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
    } else {
      setError("No product selected for checkout.");
      setIsLoading(false);
    }
  }, [productId]);

  const handleConfirmOrder = async () => {
    if (!product || !user) {
      toast({
        title: "Error",
        description: "Cannot proceed with checkout. User or product missing.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Assuming the UserProvider gives access to a token
          // Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          paymentMethod: selectedPaymentOption,
          // Add other relevant details
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create order.');
      }

      toast({
        title: "Order Confirmed!",
        description: "Your order has been placed successfully.",
      });
      // Redirect to an order success page or dashboard
      // router.push('/dashboard/orders');

    } catch (err: any) {
      setError(err.message);
      toast({
        title: "Checkout Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full max-w-md mx-auto" />;
  }

  if (error) {
    return <div className="text-center text-red-500 py-10">{error}</div>;
  }

  if (!product) {
    return <div className="text-center py-10">Could not load product details.</div>;
  }

  const installmentAmount = (product.price / 4).toFixed(2);
  const imageUrl = product.images?.[0]?.url || "/placeholder-image.jpg";

  const renderStep = () => {
    switch (step) {
      case STEPS.DELIVERY:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Delivery Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{mockAddress.line1}</p>
                  <p className="text-sm text-gray-500">{mockAddress.city}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
              <Button className="w-full mt-6" onClick={() => setStep(STEPS.PAYMENT)}>
                Confirm Address
              </Button>
            </CardContent>
          </Card>
        );
      case STEPS.PAYMENT:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedPaymentOption} onValueChange={setSelectedPaymentOption} className="space-y-4">
                <Label htmlFor="pay_30_days" className="flex items-center justify-between p-4 border rounded-lg cursor-pointer">
                  <div>
                    <p className="font-semibold">Pay 30 days after</p>
                    <p className="text-sm text-gray-500">Interest-free payment after 30 days</p>
                  </div>
                  <RadioGroupItem value="pay_30_days" id="pay_30_days" />
                </Label>
                <Label htmlFor="split_pay" className="flex items-center justify-between p-4 border rounded-lg cursor-pointer has-[:checked]:border-blue-500">
                  <div>
                    <p className="font-semibold">Split in 4x payments</p>
                    <p className="text-sm text-gray-500">4x interest-free payment</p>
                  </div>
                  <RadioGroupItem value="split_pay" id="split_pay" />
                </Label>
              </RadioGroup>
              <Separator className="my-6" />
              <div className="flex items-center space-x-4 mb-6">
                <div className="relative h-16 w-16 rounded-lg bg-gray-100">
                  <Image src={imageUrl} alt={product.name} layout="fill" objectFit="cover" className="rounded-lg" />
                </div>
                <div>
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-lg font-bold">${product.price}</p>
                </div>
              </div>
              <Button className="w-full" onClick={() => setStep(STEPS.CONFIRMATION)}>
                Continue
              </Button>
            </CardContent>
          </Card>
        );
      case STEPS.CONFIRMATION:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Confirm Order</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">Delivery to:</h3>
                  <p>{mockAddress.line1}, {mockAddress.city}</p>
                </div>
                <Separator />
                <div>
                  <h3 className="font-semibold">Payment method:</h3>
                  <p>{selectedPaymentOption === 'split_pay' ? 'Split in 4x payments' : 'Pay 30 days after'}</p>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <p>Subtotal</p>
                  <p>${product.price.toFixed(2)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p>Shipping</p>
                  <p>Free</p>
                </div>
                <div className="flex justify-between items-center font-bold text-lg">
                  <p>Total</p>
                  <p>${product.price.toFixed(2)}</p>
                </div>
              </div>
              {selectedPaymentOption === 'split_pay' && (
                <div className="mt-6">
                  <h3 className="font-semibold mb-2">Payment schedule</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between"><span>1st Payment (Today)</span><span>${installmentAmount}</span></div>
                    <div className="flex justify-between"><span>2nd Payment</span><span>${installmentAmount}</span></div>
                    <div className="flex justify-between"><span>3rd Payment</span><span>${installmentAmount}</span></div>
                    <div className="flex justify-between"><span>4th Payment</span><span>${installmentAmount}</span></div>
                  </div>
                </div>
              )}
              <Button className="w-full mt-6" size="lg" onClick={handleConfirmOrder} disabled={isSubmitting}>
                {isSubmitting ? "Placing Order..." : "Confirm Order"}
              </Button>
            </CardContent>
          </Card>
        )
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case STEPS.DELIVERY: return "Checkout";
      case STEPS.PAYMENT: return "Checkout";
      case STEPS.CONFIRMATION: return "Review";
      default: return "Checkout";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => {
              if (step === STEPS.PAYMENT) setStep(STEPS.DELIVERY);
              else if (step === STEPS.CONFIRMATION) setStep(STEPS.PAYMENT);
              else history.back();
            }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{getStepTitle()}</h1>
            <div className="w-8"></div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-md">
        {renderStep()}
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-center p-10">Loading...</div>}>
      <CheckoutFlow />
    </Suspense>
  )
}