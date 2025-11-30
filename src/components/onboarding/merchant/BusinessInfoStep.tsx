"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  businessRegNumber: z.string().optional(),
  businessAddress: z.string().min(5, "Business address is required"),
});

type FormData = z.infer<typeof schema>;

interface BusinessInfoStepProps {
  onNext: (data: FormData) => void;
}

export function BusinessInfoStep({ onNext }: BusinessInfoStepProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="businessName">Business Name</Label>
        <Input id="businessName" {...register("businessName")} />
        {errors.businessName && <p className="text-red-500 text-sm">{errors.businessName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessRegNumber">Business Registration Number (Optional)</Label>
        <Input id="businessRegNumber" {...register("businessRegNumber")} />
      </div>
       <div className="space-y-2">
        <Label htmlFor="businessAddress">Business Address</Label>
        <Input id="businessAddress" {...register("businessAddress")} />
        {errors.businessAddress && <p className="text-red-500 text-sm">{errors.businessAddress.message}</p>}
      </div>
      <Button type="submit" className="w-full">Next</Button>
    </form>
  );
}
