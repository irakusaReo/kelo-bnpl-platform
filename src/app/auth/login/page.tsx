import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
import { AuthLayout } from "@/components/layout/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout
      title="Welcome back"
      description="Enter your credentials to access your account"
    >
      <Suspense fallback={<div className="h-64 w-full animate-pulse rounded-lg bg-muted" />}>
        <LoginForm />
      </Suspense>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don’t have an account?{" "}
        <Link href="/auth/register" className="font-semibold text-primary hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
