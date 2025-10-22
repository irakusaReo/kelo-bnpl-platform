"use client";

import { useUser } from "@/contexts/UserContext";
import { PageHeader } from "@/components/layout/PageHeader";
import { PaymentsTable } from "@/components/tables/payments-table";
import { Loader2 } from "lucide-react";
import { usePayments } from "@/hooks/api/use-payments";
import { Card, CardContent } from "@/components/ui/card";

export default function DashboardPaymentsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const { data: payments, isLoading: isPaymentsLoading } = usePayments(user?.id);

  const isLoading = isUserLoading || isPaymentsLoading;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <PageHeader
        title="Payment History"
        description="View and manage all your past and upcoming payments."
      />
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : payments && payments.length > 0 ? (
        <PaymentsTable payments={payments} />
      ) : (
        <Card>
            <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                    You have no payment history.
                </p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}
