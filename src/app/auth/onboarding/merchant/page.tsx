"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { BusinessInfoStep } from "@/components/onboarding/merchant/BusinessInfoStep";
import { StoreSetupStep } from "@/components/onboarding/merchant/StoreSetupStep";
import { PayoutConfigStep } from "@/components/onboarding/merchant/PayoutConfigStep";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = ["Business Information", "Store Setup", "Payout Configuration"];

export default function MerchantOnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const router = useRouter();

  const handleNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Onboarding complete
      toast.success("Merchant onboarding complete! Welcome to Kelo.");
      router.push("/merchant/dashboard");
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <BusinessInfoStep onNext={handleNext} />;
      case 1:
        return <StoreSetupStep onNext={handleNext} />;
      case 2:
        return <PayoutConfigStep onNext={handleNext} />;
      default:
        return "Unknown step";
    }
  };

  return (
    <>
      <Toaster richColors />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Merchant Onboarding</CardTitle>
            <CardDescription>Complete the steps to set up your merchant account.</CardDescription>
          </CardHeader>
          <CardContent>
            <h2 className="text-lg font-semibold mb-4">{steps[activeStep]}</h2>

            <div>{getStepContent(activeStep)}</div>

            <div className="flex justify-between mt-8">
              <Button onClick={handleBack} disabled={activeStep === 0}>
                Back
              </Button>
              {/* The 'Next' button will be part of each step component */}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
