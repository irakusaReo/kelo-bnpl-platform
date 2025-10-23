
'use client'

import Link from 'next/link'
import { MainNav } from '@/components/layout/main-nav'
import { UserNav } from '@/components/layout/user-nav'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import { MobileNav } from '@/components/layout/mobile-nav'

export default function Header() {
  const { data: session, status } = useSession()
  const isAuthenticated = status === 'authenticated'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <MainNav />
        <MobileNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {isAuthenticated ? (
              <UserNav />
            ) : (
              <>
                <Button asChild variant="ghost" className="hidden md:inline-flex">
                  <Link href="/auth/login">Login</Link>
                </Button>
                <Button asChild className="hidden md:inline-flex">
                  <Link href="/auth/register">Sign Up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
