"use client";

import { useUser } from "@/contexts/UserContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoanCard } from "@/components/dashboard/LoanCard";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useLoans } from "@/hooks/api/use-loans";

export default function DashboardLoansPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: loans, isLoading: isLoansLoading } = useLoans(user?.id);

  const isLoading = isUserLoading || isLoansLoading;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader
        title="Loan Management"
        description="View your active and past loans."
      />
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : loans && loans.length > 0 ? (
        <div className="space-y-6">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              You have no active or past loans.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
