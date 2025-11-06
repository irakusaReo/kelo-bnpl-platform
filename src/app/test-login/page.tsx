"use client";

import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function TestLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      signIn("mock", {
        redirect: false,
        userId: "test-user",
      });
    }
  }, [status]);

  useEffect(() => {
    if (session) {
      router.push("/credit");
    }
  }, [session, router]);

  return <div>Loading...</div>;
}
