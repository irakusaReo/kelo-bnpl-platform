"use client";

import Link from "next/link";
import { useUser } from "@/contexts/UserContext";
import { Button } from "@/components/ui/button";
import { UserNav } from "@/components/layout/UserNav";
import { MainNav } from "@/components/layout/MainNav";
import { ModeToggle } from "@/components/layout/ModeToggle";

export default function Header() {
  const { user, isLoading } = useUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-2xl font-bold text-primary">
            Kelo
          </Link>
          <MainNav />
        </div>

        <div className="flex items-center space-x-4">
          <ModeToggle />
          {isLoading ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <UserNav />
          ) : (
            <div className="flex items-center space-x-2">
              <Button asChild variant="ghost">
                <Link href="/auth/login">Login</Link>
              </Button>
              <Button asChild>
                <Link href="/auth/register">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
