import { Suspense } from "react";
import Link from "next/link";
import { MerchantRegisterForm } from "@/components/forms/MerchantRegisterForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function MerchantRegisterPage() {
  return (
    <AuthLayout
      title="Merchant Registration"
      description="Join Kelo as a merchant and grow your business"
    >
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-lg bg-muted" />}>
        <MerchantRegisterForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already a merchant?{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted-foreground">
        Not a merchant?{" "}
        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
          Register as a user
        </Link>
      </p>
    </AuthLayout>
  );
}
