"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  CreditCard,
  Wallet as WalletIcon,
  BarChart3,
  Settings,
  Users,
  Building2,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { WorkspaceSwitcher } from "./WorkspaceSwitcher";

const navigation = {
  customer: [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Loans", href: "/dashboard/loans", icon: CreditCard },
    { name: "Payments", href: "/dashboard/payments", icon: WalletIcon },
    { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
    { name: "Profile", href: "/dashboard/profile", icon: Users },
  ],
  merchant: [
    { name: "Dashboard", href: "/merchant", icon: Home },
    { name: "Customers", href: "/merchant/customers", icon: Users },
    { name: "Loans", href: "/merchant/loans", icon: CreditCard },
    { name: "Payments", href: "/merchant/payments", icon: WalletIcon },
    { name: "Analytics", href: "/merchant/analytics", icon: TrendingUp },
    { name: "Integrations", href: "/merchant/integrations", icon: Building2 },
  ],
  admin: [
    { name: "Dashboard", href: "/admin", icon: Home },
    { name: "Users", href: "/admin/users", icon: Users },
    { name: "Merchants", href: "/admin/merchants", icon: Building2 },
    { name: "Loans", href: "/admin/loans", icon: CreditCard },
    { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
    { name: "Security", href: "/admin/security", icon: ShieldCheck },
  ],
};

interface SidebarProps {
  userRole: "customer" | "merchant" | "admin";
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navigation[userRole];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r bg-background">
      <div className="p-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold text-primary">
          Kelo
        </Link>
      </div>
      <div className="px-4">
        <WorkspaceSwitcher />
      </div>
      <Separator className="my-4" />
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href) && (item.href !== '/dashboard' || pathname === '/dashboard');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 mt-auto">
        <Separator className="my-4" />
        <Link
            href={ `/${userRole}/settings` }
            className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(`/${userRole}/settings`)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
        >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
