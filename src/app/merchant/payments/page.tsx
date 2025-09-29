"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentsTable } from "@/components/tables/payments-table";
import { SettlementDashboard } from "@/components/merchant/settlement-dashboard";
import { StatsCard } from "@/components/ui/stats-card";
import { 
  CreditCard, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Banknote,
  RefreshCw,
  Download,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react";
import { useSocket } from "@/lib/socket/socket-provider";
import { toast } from "sonner";
import { format } from "date-fns";

interface Payment {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  currency: string;
  method: "mpesa" | "card" | "bank_transfer" | "crypto";
  status: "completed" | "pending" | "failed" | "refunded";
  loanId: string;
  dueDate: Date;
  paidAt?: Date;
  transactionId?: string;
  fees: number;
  netAmount: number;
  description: string;
  retryCount?: number;
  nextRetryDate?: Date;
}

interface Settlement {
  id: string;
  period: string;
  startDate: Date;
  endDate: Date;
  totalAmount: number;
  fees: number;
  netAmount: number;
  status: "pending" | "processing" | "completed" | "failed";
  paymentMethods: {
    mpesa: number;
    card: number;
    bank_transfer: number;
    crypto: number;
  };
  transactionCount: number;
  settledAt?: Date;
  nextSettlementDate?: Date;
}

// Mock data for demonstration
const mockPayments: Payment[] = [
  {
    id: "PAY-001",
    customerName: "John Doe",
    customerEmail: "john.doe@email.com",
    amount: 7500,
    currency: "KES",
    method: "mpesa",
    status: "completed",
    loanId: "LOAN-001",
    dueDate: new Date("2024-01-15"),
    paidAt: new Date("2024-01-14"),
    transactionId: "MPESA123456",
    fees: 150,
    netAmount: 7350,
    description: "Monthly loan payment",
  },
  {
    id: "PAY-002",
    customerName: "Jane Smith",
    customerEmail: "jane.smith@email.com",
    amount: 6250,
    currency: "KES",
    method: "card",
    status: "completed",
    loanId: "LOAN-002",
    dueDate: new Date("2024-01-16"),
    paidAt: new Date("2024-01-15"),
    transactionId: "CARD789012",
    fees: 125,
    netAmount: 6125,
    description: "Monthly loan payment",
  },
  {
    id: "PAY-003",
    customerName: "Mike Johnson",
    customerEmail: "mike.johnson@email.com",
    amount: 5000,
    currency: "KES",
    method: "mpesa",
    status: "pending",
    loanId: "LOAN-003",
    dueDate: new Date("2024-01-17"),
    fees: 100,
    netAmount: 4900,
    description: "Monthly loan payment",
    retryCount: 0,
    nextRetryDate: new Date("2024-01-18"),
  },
  {
    id: "PAY-004",
    customerName: "Sarah Williams",
    customerEmail: "sarah.williams@email.com",
    amount: 8750,
    currency: "KES",
    method: "bank_transfer",
    status: "failed",
    loanId: "LOAN-004",
    dueDate: new Date("2024-01-16"),
    fees: 175,
    netAmount: 8575,
    description: "Monthly loan payment",
    retryCount: 2,
    nextRetryDate: new Date("2024-01-18"),
  },
  {
    id: "PAY-005",
    customerName: "David Brown",
    customerEmail: "david.brown@email.com",
    amount: 12000,
    currency: "KES",
    method: "crypto",
    status: "completed",
    loanId: "LOAN-005",
    dueDate: new Date("2024-01-15"),
    paidAt: new Date("2024-01-14"),
    transactionId: "CRYPTO345678",
    fees: 240,
    netAmount: 11760,
    description: "Monthly loan payment",
  }
];

const mockSettlements: Settlement[] = [
  {
    id: "SET-001",
    period: "January 2024 - Week 1",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-01-07"),
    totalAmount: 125000,
    fees: 2500,
    netAmount: 122500,
    status: "completed",
    paymentMethods: {
      mpesa: 75000,
      card: 35000,
      bank_transfer: 10000,
      crypto: 5000,
    },
    transactionCount: 45,
    settledAt: new Date("2024-01-10"),
  },
  {
    id: "SET-002",
    period: "January 2024 - Week 2",
    startDate: new Date("2024-01-08"),
    endDate: new Date("2024-01-14"),
    totalAmount: 145000,
    fees: 2900,
    netAmount: 142100,
    status: "completed",
    paymentMethods: {
      mpesa: 85000,
      card: 40000,
      bank_transfer: 15000,
      crypto: 5000,
    },
    transactionCount: 52,
    settledAt: new Date("2024-01-17"),
  },
  {
    id: "SET-003",
    period: "January 2024 - Week 3",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-01-21"),
    totalAmount: 135000,
    fees: 2700,
    netAmount: 132300,
    status: "processing",
    paymentMethods: {
      mpesa: 80000,
      card: 38000,
      bank_transfer: 12000,
      crypto: 5000,
    },
    transactionCount: 48,
  },
  {
    id: "SET-004",
    period: "January 2024 - Week 4",
    startDate: new Date("2024-01-22"),
    endDate: new Date("2024-01-28"),
    totalAmount: 155000,
    fees: 3100,
    netAmount: 151900,
    status: "pending",
    paymentMethods: {
      mpesa: 90000,
      card: 45000,
      bank_transfer: 15000,
      crypto: 5000,
    },
    transactionCount: 58,
  }
];

export default function MerchantPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [settlements, setSettlements] = useState<Settlement[]>(mockSettlements);
  const [stats, setStats] = useState({
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalVolume: 0,
    totalFees: 0,
    netRevenue: 0,
  });
  const { isConnected, lastMessage } = useSocket();

  useEffect(() => {
    // Calculate stats
    const totalPayments = payments.length;
    const completedPayments = payments.filter(p => p.status === "completed").length;
    const pendingPayments = payments.filter(p => p.status === "pending").length;
    const failedPayments = payments.filter(p => p.status === "failed").length;
    const totalVolume = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalFees = payments.reduce((sum, p) => sum + p.fees, 0);
    const netRevenue = payments.reduce((sum, p) => sum + p.netAmount, 0);

    setStats({
      totalPayments,
      completedPayments,
      pendingPayments,
      failedPayments,
      totalVolume,
      totalFees,
      netRevenue,
    });
  }, [payments]);

  useEffect(() => {
    // Handle real-time socket messages
    if (lastMessage) {
      console.log("Received socket message:", lastMessage);
      if (lastMessage.type === "new_payment") {
        setPayments(prev => [lastMessage.data, ...prev]);
        toast.success("New payment received!");
      } else if (lastMessage.type === "payment_status_update") {
        setPayments(prev => 
          prev.map(p => 
            p.id === lastMessage.data.paymentId 
              ? { ...p, status: lastMessage.data.status, paidAt: lastMessage.data.paidAt }
              : p
          )
        );
        toast.info(`Payment status updated to ${lastMessage.data.status}`);
      }
    }
  }, [lastMessage]);

  const handleRefund = (paymentId: string, amount: number) => {
    setPayments(prev => 
      prev.map(p => 
        p.id === paymentId 
          ? { ...p, status: "refunded" as const }
          : p
      )
    );
    toast.success(`Refund of KES ${amount.toLocaleString()} processed successfully!`);
  };

  const handleRetry = (paymentId: string) => {
    setPayments(prev => 
      prev.map(p => 
        p.id === paymentId 
          ? { 
              ...p, 
              status: "pending" as const,
              retryCount: (p.retryCount || 0) + 1,
              nextRetryDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
            }
          : p
      )
    );
    toast.success("Payment retry initiated!");
  };

  const handleViewDetails = (payment: Payment) => {
    console.log("View details for payment:", payment);
  };

  const handleExportReport = (settlementId: string) => {
    toast.success("Settlement report exported successfully!");
  };

  const handleViewSettlementDetails = (settlement: Settlement) => {
    console.log("View details for settlement:", settlement);
  };

  const completedPayments = payments.filter(p => p.status === "completed");
  const pendingPayments = payments.filter(p => p.status === "pending");
  const failedPayments = payments.filter(p => p.status === "failed");

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Payment Processing
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage payments, settlements, and financial transactions
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500">
              {isConnected ? 'Real-time updates active' : 'Real-time updates disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Volume"
          value={`KES ${stats.totalVolume.toLocaleString()}`}
          description="This month"
          trend={{
            value: 15.2,
            label: "from last month",
            type: "up"
          }}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Completed Payments"
          value={stats.completedPayments}
          description="Successfully processed"
          trend={{
            value: 8.7,
            label: "success rate",
            type: "up"
          }}
          icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Pending Payments"
          value={stats.pendingPayments}
          description="Awaiting processing"
          trend={{
            value: 3.2,
            label: "from yesterday",
            type: "down"
          }}
          icon={<Clock className="h-4 w-4 text-muted-foreground" />}
        />
        <StatsCard
          title="Failed Payments"
          value={stats.failedPayments}
          description="Requires attention"
          icon={<AlertCircle className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payments">
            Payments ({stats.totalPayments})
          </TabsTrigger>
          <TabsTrigger value="settlements">
            Settlements ({settlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <PaymentsTable
            payments={payments}
            onRefund={handleRefund}
            onRetry={handleRetry}
            onViewDetails={handleViewDetails}
          />
        </TabsContent>

        <TabsContent value="settlements">
          <SettlementDashboard
            settlements={settlements}
            onExportReport={handleExportReport}
            onViewDetails={handleViewSettlementDetails}
          />
        </TabsContent>
      </Tabs>

      {/* Payment Methods Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">M-Pesa</CardTitle>
            <Smartphone className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 325,000</div>
            <p className="text-xs text-muted-foreground">
              65% of total volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Card</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 125,000</div>
            <p className="text-xs text-muted-foreground">
              25% of total volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Transfer</CardTitle>
            <Banknote className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 40,000</div>
            <p className="text-xs text-muted-foreground">
              8% of total volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crypto</CardTitle>
            <RefreshCw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES 10,000</div>
            <p className="text-xs text-muted-foreground">
              2% of total volume
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payment Activity</CardTitle>
          <CardDescription>
            Latest payment transactions and status updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payments.slice(0, 5).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  {payment.method === "mpesa" && <Smartphone className="h-4 w-4 text-green-600" />}
                  {payment.method === "card" && <CreditCard className="h-4 w-4 text-blue-600" />}
                  {payment.method === "bank_transfer" && <Banknote className="h-4 w-4 text-purple-600" />}
                  {payment.method === "crypto" && <RefreshCw className="h-4 w-4 text-orange-600" />}
                  <div>
                    <p className="font-medium">{payment.customerName}</p>
                    <p className="text-sm text-gray-500">KES {payment.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(payment.status)}
                  <span className="text-sm text-gray-500">
                    {payment.paidAt ? format(payment.paidAt, "MMM dd") : format(payment.dueDate, "MMM dd")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function getStatusBadge(status: Payment["status"]) {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline"
    } as const;

    const labels = {
      completed: "Completed",
      pending: "Pending",
      failed: "Failed",
      refunded: "Refunded"
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  }
}