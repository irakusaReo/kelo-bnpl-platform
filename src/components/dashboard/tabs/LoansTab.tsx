"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const loans = [
    { id: "LOAN-001", merchant: "MegaMart", amount: "KSH 5,000", dueDate: "2024-11-15", status: "Pending" },
    { id: "LOAN-002", merchant: "Gadget World", amount: "KSH 12,500", dueDate: "2024-11-20", status: "Due Soon" },
    { id: "LOAN-003", merchant: "Style Boutique", amount: "KSH 2,300", dueDate: "2024-10-30", status: "Paid" },
    { id: "LOAN-004", merchant: "Home Appliances", amount: "KSH 35,000", dueDate: "2024-11-05", status: "Overdue" },
];

export function LoansTab() {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "Paid":
        return "default";
      case "Pending":
        return "secondary";
      case "Overdue":
        return "destructive";
      case "Due Soon":
          return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Loan ID</TableHead>
          <TableHead>Merchant</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {loans.map((loan) => (
          <TableRow key={loan.id}>
            <TableCell className="font-medium">{loan.id}</TableCell>
            <TableCell>{loan.merchant}</TableCell>
            <TableCell>{loan.amount}</TableCell>
            <TableCell>{loan.dueDate}</TableCell>
            <TableCell>
                <Badge variant={getBadgeVariant(loan.status)}>{loan.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm">
                View Details
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
