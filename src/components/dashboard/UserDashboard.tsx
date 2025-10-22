"use client";

import { useUser } from "@/hooks/use-user";
import { OverviewTab } from "@/components/dashboard/tabs/OverviewTab";
import { LoansTab } from "@/components/dashboard/tabs/LoansTab";
import { StakingTab } from "@/components/dashboard/tabs/StakingTab";
import { PageHeader } from "@/components/layout/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Profile } from "@/types";

interface UserDashboardClientProps {
  user: User | null;
  profile: Profile | null;
}

export function UserDashboard({ user, profile }: UserDashboardClientProps) {

  if (!user || !profile) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Authentication Error</h1>
          <p className="text-muted-foreground">
            We couldn’t load your user data. Please try logging in again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${profile.firstName}! Here’s your financial overview.`}
      />
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="loans">Active Loans</TabsTrigger>
          <TabsTrigger value="staking">Staking</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="loans" className="space-y-4">
          <LoansTab />
        </TabsContent>
        <TabsContent value="staking" className="space-y-4">
          <StakingTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
