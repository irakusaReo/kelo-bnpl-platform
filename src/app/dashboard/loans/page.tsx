
'use client'

import PageHeader from "@/components/layout/page-header";
import { useLoans } from "@/hooks/api/use-loans";
import { LoanCard } from "@/components/dashboard/loan-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export default function LoansPage() {
  const { data: loans, isLoading, error } = useLoans();

  return (
    <>
      <PageHeader
        title="Loan Management"
        description="View your active loans, applications, and payment history."
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-4 text-muted-foreground">Loading loans...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch your loan data. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {loans && loans.length === 0 && (
        <Alert>
          <AlertTitle>No Loans Found</AlertTitle>
          <AlertDescription>
            You do not have any active loans or applications.
          </AlertDescription>
        </Alert>
      )}

      {loans && loans.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </div>
      )}
    </>
  );
}
