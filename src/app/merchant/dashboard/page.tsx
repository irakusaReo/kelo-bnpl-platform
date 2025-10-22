"use client";

import { useUser } from "@/contexts/UserContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { MerchantOverview } from "@/components/merchant/MerchantOverview";
import { RecentSales } from "@/components/merchant/RecentSales";
import { CalendarView } from "@/components/merchant/CalendarView";
import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export default function MerchantDashboardPage() {
  const { profile, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (profile?.role !== "merchant") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          This dashboard is only for merchant accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <PageHeader
            title="Merchant Dashboard"
            description="Here's your business overview."
        />
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Download Report
        </Button>
      </div>
      <MerchantOverview />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RecentSales />
        <CalendarView />
      </div>
    </div>
  );
}
