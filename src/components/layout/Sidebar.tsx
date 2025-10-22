'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Home,
  CreditCard,
  Wallet as WalletIcon,
  BarChart3,
  Settings,
  Users,
  Building2,
  TrendingUp,
  ShoppingBag,
  Landmark
} from 'lucide-react'

const navigation = {
  customer: [
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Loans', href: '/dashboard/loans', icon: CreditCard },
    { name: 'Payments', href: '/dashboard/payments', icon: WalletIcon },
    { name: 'Staking', href: '/dashboard/staking', icon: Landmark },
    { name: 'Profile', href: '/dashboard/profile', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  merchant: [
    { name: 'Dashboard', href: '/merchant', icon: Home },
    { name: 'Wallet', href: '/merchant/wallet', icon: WalletIcon },
    { name: 'Customers', href: '/merchant/customers', icon: Users },
    { name: 'Loans', href: '/merchant/loans', icon: CreditCard },
    { name: 'Payments', href: '/merchant/payments', icon: WalletIcon },
    { name: 'Analytics', href: '/merchant/analytics', icon: TrendingUp },
    { name: 'Integrations', href: '/merchant/integrations', icon: Building2 },
    { name: 'Settings', href: '/merchant/settings', icon: Settings },
  ],
  admin: [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Merchants', href: '/admin/merchants', icon: Building2 },
    { name: 'Loans', href: '/admin/loans', icon: CreditCard },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ],
}

interface SidebarProps {
  userRole: 'customer' | 'merchant' | 'admin'
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()
  const navItems = navigation[userRole]

  return (
    <aside className="w-64 bg-background border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold">
          {userRole === 'customer' && 'Customer Portal'}
          {userRole === 'merchant' && 'Merchant Portal'}
          {userRole === 'admin' && 'Admin Panel'}
        </h2>
      </div>

      <nav className="px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}