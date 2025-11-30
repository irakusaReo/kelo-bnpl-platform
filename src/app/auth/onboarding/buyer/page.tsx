"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "sonner";
import { PersonalInfoStep } from "@/components/onboarding/buyer/PersonalInfoStep";
import { WalletConnectionStep } from "@/components/onboarding/buyer/WalletConnectionStep";
import { HederaDIDStep } from "@/components/onboarding/buyer/HederaDIDStep";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const steps = ["Personal Information", "Connect Wallets", "Create Hedera DID"];

export default function BuyerOnboardingPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({});
  const router = useRouter();

  const handleNext = (data: any) => {
    setFormData((prev) => ({ ...prev, ...data }));
    if (activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    } else {
      // Onboarding complete
      toast.success("Onboarding complete! Welcome to Kelo.");
      router.push("/dashboard");
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <PersonalInfoStep onNext={handleNext} />;
      case 1:
        return <WalletConnectionStep onNext={handleNext} />;
      case 2:
        return <HederaDIDStep onNext={handleNext} />;
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
            <CardTitle>Buyer Onboarding</CardTitle>
            <CardDescription>Complete the steps to set up your account.</CardDescription>
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
