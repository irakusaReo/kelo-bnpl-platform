
'use client'

import { NavLink } from "@/components/layout/nav-link"
import {
  LayoutDashboard,
  Landmark,
  CreditCard,
  User,
  Settings,
  Wallet,
  Coins,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const sidebarNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Loans",
    href: "/dashboard/loans",
    icon: Landmark,
  },
  {
    title: "Payments",
    href: "/dashboard/payments",
    icon: CreditCard,
  },
  {
    title: "Credit Profile",
    href: "/dashboard/credit",
    icon: User,
  },
  {
    title: "Staking",
    href: "/dashboard/staking",
    icon: Coins,
  },
  {
    title: "Wallet",
    href: "/dashboard/wallet",
    icon: Wallet,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:block w-64 flex-shrink-0 border-r bg-background">
      <div className="flex h-full flex-col">
        <div className="flex-1 space-y-4 p-4">
          <h2 className="px-4 text-lg font-semibold tracking-tight">
            My Account
          </h2>
          <nav className="grid items-start gap-2">
            {sidebarNavItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
              >
                <div className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                  pathname === item.href ? "bg-accent" : "transparent"
                )}>
                  <item.icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                </div>
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  )
}
