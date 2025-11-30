"use client";

import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const schema = z.object({
  storeName: z.string().min(2, "Store name is required"),
  storeUrl: z.string().url("Must be a valid URL").optional().or(z.literal('')),
  storeAddress: z.string().optional(),
  logoUrl: z.string().url("Must be a valid URL for the logo").optional().or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface StoreSetupStepProps {
  onNext: (data: FormData) => void;
}

export function StoreSetupStep({ onNext }: StoreSetupStepProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="storeName">Store Name</Label>
        <Input id="storeName" {...register("storeName")} placeholder="e.g., Kelo's Gadgets" />
        {errors.storeName && <p className="text-red-500 text-sm">{errors.storeName.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="storeUrl">Store URL (Optional)</Label>
        <Input id="storeUrl" {...register("storeUrl")} placeholder="https://your-store.com" />
        {errors.storeUrl && <p className="text-red-500 text-sm">{errors.storeUrl.message}</p>}
      </div>
       <div className="space-y-2">
        <Label htmlFor="storeAddress">Physical Store Address (Optional)</Label>
        <Textarea id="storeAddress" {...register("storeAddress")} placeholder="123 Kelo Street, Nairobi" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="logoUrl">Logo URL (Optional)</Label>
        <Input id="logoUrl" {...register("logoUrl")} placeholder="https://your-store.com/logo.png" />
        {errors.logoUrl && <p className="text-red-500 text-sm">{errors.logoUrl.message}</p>}
      </div>
      <Button type="submit" className="w-full">Next</Button>
    </form>
  );
}
