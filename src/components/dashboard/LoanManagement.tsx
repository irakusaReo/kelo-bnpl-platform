'use client'

import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useToast } from '@/hooks/use-toast'

// Define types for our data
type Repayment = {
  id: string;
  due_date: string;
  amount: number;
  status: 'pending' | 'paid' | 'overdue';
};

type Loan = {
  id: string;
  amount: number;
  status: 'active' | 'repaid' | 'defaulted';
  created_at: string;
  merchant_stores: { // Assumes a relationship is defined in Supabase/Prisma
    name: string;
  } | null;
  repayments: Repayment[];
};

export function LoanManagement() {
  const { user, supabase, isLoading: isUserLoading } = useUser()
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchLoans = async () => {
      if (!user || !supabase) return

      setIsLoading(true)

      const { data, error } = await supabase
        .from('loans')
        .select(`
          id,
          amount,
          status,
          created_at,
          merchant_stores ( name ),
          repayments ( id, due_date, amount, status )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching loans:", error)
        setLoans([])
      } else {
        setLoans(data as Loan[])
      }

      setIsLoading(false)
    }

    if (user) {
      fetchLoans()
    }
  }, [user, supabase])

  const calculateRepaymentProgress = (loan: Loan) => {
    const totalPaid = loan.repayments
      .filter(r => r.status === 'paid')
      .reduce((acc, r) => acc + r.amount, 0)
    return (totalPaid / loan.amount) * 100
  }

  const getTotalPaid = (loan: Loan) => {
     return loan.repayments
      .filter(r => r.status === 'paid')
      .reduce((acc, r) => acc + r.amount, 0)
  }

  if (isUserLoading || isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Loans</h1>
       {loans.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">You have no active or past loans.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {loans.map((loan) => (
            <Card key={loan.id}>
              <CardHeader className="flex flex-row justify-between items-start">
                <div>
                  <CardTitle>{loan.merchant_stores?.name ?? 'Kelo Loan'}</CardTitle>
                  <CardDescription>
                    Loan taken on {new Date(loan.created_at).toLocaleDateString()}
                  </CardDescription>
                </div>
                <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="capitalize">{loan.status}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">
                       KSH {getTotalPaid(loan).toLocaleString()} / KSH {loan.amount.toLocaleString()}
                    </span>
                    <span className="text-sm">{Math.round(calculateRepaymentProgress(loan))}%</span>
                  </div>
                  <Progress value={calculateRepaymentProgress(loan)} />
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Upcoming Payments</h4>
                  <div className="space-y-2">
                    {loan.repayments.filter(r => r.status === 'pending' || r.status === 'overdue').length > 0 ? (
                      loan.repayments
                        .filter(r => r.status === 'pending' || r.status === 'overdue')
                        .slice(0, 3) // Show next 3
                        .map(repayment => (
                          <div key={repayment.id} className="flex justify-between items-center text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                            <span>Due: {new Date(repayment.due_date).toLocaleDateString()}</span>
                            <span className="font-medium">KSH {repayment.amount.toLocaleString()}</span>
                            {repayment.status === 'overdue' && <Badge variant="destructive">Overdue</Badge>}
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-muted-foreground italic">No upcoming payments. This loan is fully paid.</p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                 {loan.status === 'active' && (
                    <Button onClick={() => {
                      toast({
                        title: "Feature Coming Soon",
                        description: "The ability to make payments directly from the dashboard is currently under development.",
                      })
                    }}>Make a Payment</Button>
                 )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
