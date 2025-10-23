
'use client'

import PageHeader from "@/components/layout/page-header";
import { usePayments } from "@/hooks/api/use-payments";
import { PaymentsTable } from "@/components/dashboard/payments-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { paymentColumns } from "@/components/dashboard/payment-columns";

export default function PaymentsPage() {
  const { data: payments, isLoading, error } = usePayments();

  return (
    <>
      <PageHeader
        title="Payment History"
        description="A detailed record of all your payments."
      />

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-4 text-muted-foreground">Loading payments...</span>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to fetch your payment data. Please try again later.
          </AlertDescription>
        </Alert>
      )}

      {payments && (
        <PaymentsTable columns={paymentColumns} data={payments} />
      )}
    </>
  );
}
