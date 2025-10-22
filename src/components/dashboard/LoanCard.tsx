"use client";

import { Loan } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface LoanCardProps {
  loan: Loan;
}

export function LoanCard({ loan }: LoanCardProps) {
  const calculateRepaymentProgress = () => {
    if (!loan.amount || loan.amount === 0) return 0;
    const totalPaid =
      loan.repayments?.filter((r) => r.status === "paid").reduce((acc, r) => acc + r.amount, 0) || 0;
    return (totalPaid / loan.amount) * 100;
  };

  const totalPaid = loan.repayments?.filter(r => r.status === 'paid').reduce((acc, r) => acc + r.amount, 0) || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle>{loan.merchant_stores?.name ?? "Kelo Loan"}</CardTitle>
          <CardDescription>
            Loan taken on {new Date(loan.created_at).toLocaleDateString()}
          </CardDescription>
        </div>
        <Badge
          variant={loan.status === "active" ? "default" : "secondary"}
          className="capitalize"
        >
          {loan.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">
              KSH {totalPaid.toLocaleString()} / KSH {loan.amount.toLocaleString()}
            </span>
            <span className="text-sm">
              {Math.round(calculateRepaymentProgress())}%
            </span>
          </div>
          <Progress value={calculateRepaymentProgress()} />
        </div>
        <div>
          <h4 className="font-semibold mb-2">Repayment Schedule</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loan.repayments?.length > 0 ? (
                loan.repayments.map((repayment) => (
                  <TableRow
                    key={repayment.id}
                    className={cn(
                      repayment.status === "overdue" && "text-destructive"
                    )}
                  >
                    <TableCell>
                      {new Date(repayment.due_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>KSH {repayment.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          repayment.status === "paid"
                            ? "default"
                            : repayment.status === "overdue"
                            ? "destructive"
                            : "outline"
                        }
                        className="capitalize"
                      >
                        {repayment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    No repayment schedule found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter>
        {loan.status === "active" && <Button>Pay Now</Button>}
      </CardFooter>
    </Card>
  );
}
