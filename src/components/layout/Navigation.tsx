'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Home, 
  CreditCard, 
  Wallet, 
  BarChart3, 
  Settings, 
  Users,
  Building2,
  TrendingUp,
  Menu,
  X
} from 'lucide-react'

const navigation = {
  customer: [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Loans', href: '/dashboard/loans', icon: CreditCard },
    { name: 'Payments', href: '/dashboard/payments', icon: Wallet },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Profile', href: '/dashboard/profile', icon: Users },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ],
  merchant: [
    { name: 'Dashboard', href: '/merchant', icon: Home },
    { name: 'Customers', href: '/merchant/customers', icon: Users },
    { name: 'Loans', href: '/merchant/loans', icon: CreditCard },
    { name: 'Payments', href: '/merchant/payments', icon: Wallet },
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

interface NavigationProps {
  userRole: 'customer' | 'merchant' | 'admin'
  mobile?: boolean
  onClose?: () => void
}

export default function Navigation({ userRole, mobile = false, onClose }: NavigationProps) {
  const pathname = usePathname()
  const navItems = navigation[userRole]

  const handleLinkClick = () => {
    if (mobile && onClose) {
      onClose()
    }
  }

  return (
    <nav className={mobile ? 'space-y-4' : 'hidden md:flex space-x-6'}>
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={handleLinkClick}
            className={cn(
              'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              mobile
                ? isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                : isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {mobile && <item.icon className="h-5 w-5" />}
            <span>{item.name}</span>
          </Link>
        )
      })}
    </nav>
  )
}