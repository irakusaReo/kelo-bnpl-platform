"use client";

import { useState } from "react";
import { useForm, FieldValues, DefaultValues } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

export function useFormValidation<T extends FieldValues>(
  schema: z.ZodSchema<T>,
  defaultValues?: DefaultValues<T>
) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: T, onSubmitFn: (data: T) => Promise<void> | void) => {
    try {
      await onSubmitFn(data);
      toast.success("Form submitted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Form submission failed");
    }
  };

  return {
    register,
    handleSubmit: (onSubmitFn: (data: T) => Promise<void> | void) =>
      handleSubmit((data) => onSubmit(data, onSubmitFn)),
    errors,
    isSubmitting,
    reset,
    control,
    watch,
    setValue,
  };
}

// Common validation schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\+254\d{9}$/, "Invalid phone number format"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string(),
  terms: z.boolean({ message: "You must accept the terms and conditions" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loanApplicationSchema = z.object({
  amount: z.number().min(1000, "Minimum loan amount is KES 1,000")
    .max(500000, "Maximum loan amount is KES 500,000"),
  duration: z.number().min(1, "Minimum duration is 1 month")
    .max(24, "Maximum duration is 24 months"),
  purpose: z.string().min(10, "Purpose must be at least 10 characters"),
  merchantId: z.string().min(1, "Merchant is required"),
});

export const paymentSchema = z.object({
  amount: z.number().min(100, "Minimum payment amount is KES 100"),
  paymentMethod: z.enum(["mpesa", "bank_transfer", "crypto"]),
});
