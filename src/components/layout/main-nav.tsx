
import * as React from "react"
import Link from "next/link"
import { NavLink } from "@/components/layout/nav-link"
import { cn } from "@/lib/utils"

export function MainNav() {
  return (
    <div className="mr-4 hidden md:flex">
      <Link href="/" className="mr-6 flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block">Kelo</span>
      </Link>
      <nav className="flex items-center space-x-6 text-sm font-medium">
        <NavLink href="/marketplace">Marketplace</NavLink>
        <NavLink href="/dashboard">Dashboard</NavLink>
        <NavLink href="/merchant/dashboard">For Merchants</NavLink>
      </nav>
    </div>
  )
}
