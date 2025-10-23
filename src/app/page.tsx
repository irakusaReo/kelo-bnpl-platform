
'use client'

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/marketplace');
    }
  }, [status, router]);

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-16 text-center">
        <section className="hero">
          <h1 className="text-5xl font-extrabold tracking-tight lg:text-6xl">
            Welcome to Kelo
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Your modern Buy Now, Pay Later solution for the Kenyan market, enhanced with cutting-edge blockchain technology.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/marketplace">Explore Marketplace</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/auth/register">Get Started</Link>
            </Button>
          </div>
        </section>

        <section className="py-24">
          <h2 className="text-3xl font-bold tracking-tight">How It Works</h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary rounded-full text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">1. Shop</h3>
              <p className="mt-2 text-muted-foreground">
                Browse our marketplace and find the products you love.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-4 bg-primary rounded-full text-primary-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">2. Choose Kelo</h3>
              <p className="mt-2 text-muted-foreground">
                Select Kelo at checkout to split your purchase into manageable payments.
              </p>
            </div>
            <div className="flex flex-col items-center">
               <div className="p-4 bg-primary rounded-full text-primary-foreground">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">3. Pay Later</h3>
              <p className="mt-2 text-muted-foreground">
                Enjoy your purchase now and pay for it over time, interest-free.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
