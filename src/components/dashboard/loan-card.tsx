
'use client'

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// Note: You need to define the Loan type, likely in `src/types/index.ts`
import { Loan } from "@/types"
import { formatCurrency, formatDate } from "@/utils/formatting"

interface LoanCardProps {
  loan: Loan
}

export function LoanCard({ loan }: LoanCardProps) {
  const amountPaid = loan.repayments.reduce((acc, p) => acc + p.amount, 0)
  const progress = (amountPaid / loan.amount) * 100

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "default"
      case "paid":
        return "success"
      case "pending":
        return "secondary"
      case "defaulted":
        return "destructive"
      default:
        return "outline"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Loan #{loan.id.substring(0, 8)}</CardTitle>
          <Badge variant={getStatusVariant(loan.status)}>{loan.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Amount</span>
            <span className="font-mono">{formatCurrency(loan.amount)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span >Amount Paid</span>
            <span className="font-mono">{formatCurrency(amountPaid)}</span>
          </div>
        </div>
        <div>
          <Progress value={progress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {Math.round(progress)}% Paid
          </p>
        </div>
        <div className="text-sm">
          <span className="font-medium">Due Date: </span>
          <span>{formatDate(loan.dueDate)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={loan.status !== 'active'}>
          Make a Payment
        </Button>
      </CardFooter>
    </Card>
  )
}
