import { Suspense } from "react";
import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Create an account"
      description="Join Kelo and start your BNPL journey today"
    >
      <Suspense fallback={<div className="h-96 w-full animate-pulse rounded-lg bg-muted" />}>
        <RegisterForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
       <p className="mt-4 text-center text-sm text-muted-foreground">
        Are you a merchant?{" "}
        <Link
            href="/auth/merchant-register"
            className="font-semibold text-primary hover:underline"
        >
            Register here
        </Link>
        </p>
    </AuthLayout>
  );
}
