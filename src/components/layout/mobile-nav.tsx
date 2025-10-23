
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <Link
          href="/"
          className="flex items-center"
          onClick={() => setOpen(false)}
        >
          <span className="font-bold">Kelo</span>
        </Link>
        <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
          <div className="flex flex-col space-y-3">
             <Link href="/marketplace" onClick={() => setOpen(false)}>Marketplace</Link>
             <Link href="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
             <Link href="/auth/merchant-register" onClick={() => setOpen(false)}>For Merchants</Link>
          </div>
        </div>
        <div className="pl-6">
            <Button asChild>
                <Link href="/marketplace">Back to Marketplace</Link>
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
