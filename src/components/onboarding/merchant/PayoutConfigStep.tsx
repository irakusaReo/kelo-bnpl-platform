"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const schema = z.object({
  payoutMethod: z.enum(["base_usdc", "mpesa"]),
  baseWalletAddress: z.string().optional(),
  mpesaPhoneNumber: z.string().optional(),
}).refine(data => {
    if (data.payoutMethod === 'base_usdc') return !!data.baseWalletAddress;
    if (data.payoutMethod === 'mpesa') return !!data.mpesaPhoneNumber;
    return false;
}, {
    message: "Please provide the necessary payout details for the selected method.",
    path: ["baseWalletAddress"], // or mpesaPhoneNumber, path is not that important here
});

type FormData = z.infer<typeof schema>;

interface PayoutConfigStepProps {
  onNext: (data: FormData) => void;
}

export function PayoutConfigStep({ onNext }: PayoutConfigStepProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
        payoutMethod: "base_usdc",
    }
  });

  const payoutMethod = watch("payoutMethod");

  const onSubmit: SubmitHandler<FormData> = (data) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label>Select Payout Method</Label>
        <RadioGroup defaultValue="base_usdc" {...register("payoutMethod")}>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="base_usdc" id="base_usdc" />
                <Label htmlFor="base_usdc">Base Wallet (for USDC payouts)</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="mpesa" id="mpesa" />
                <Label htmlFor="mpesa">M-Pesa (for KES payouts)</Label>
            </div>
        </RadioGroup>
      </div>

      {payoutMethod === "base_usdc" && (
        <div className="space-y-2">
          <Label htmlFor="baseWalletAddress">Base Wallet Address</Label>
          <Input id="baseWalletAddress" {...register("baseWalletAddress")} placeholder="0x..." />
          {errors.baseWalletAddress && <p className="text-red-500 text-sm">{errors.baseWalletAddress.message}</p>}
        </div>
      )}

      {payoutMethod === "mpesa" && (
        <div className="space-y-2">
          <Label htmlFor="mpesaPhoneNumber">M-Pesa Phone Number</Label>
          <Input id="mpesaPhoneNumber" {...register("mpesaPhoneNumber")} placeholder="+254..." />
           {/* TODO: Add M-Pesa integration comments */}
          {errors.mpesaPhoneNumber && <p className="text-red-500 text-sm">{errors.mpesaPhoneNumber.message}</p>}
        </div>
      )}

      <Button type="submit" className="w-full">Finish Onboarding</Button>
    </form>
  );
}
