"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter,
  Download,
  MoreHorizontal,
  CreditCard,
  Calendar,
  Smartphone,
  Banknote,
  RefreshCw
} from "lucide-react";
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

interface PaymentsTableProps {
  payments: Payment[];
  onRefund?: (paymentId: string, amount: number) => void;
  onRetry?: (paymentId: string) => void;
  onViewDetails?: (payment: Payment) => void;
}

export function PaymentsTable({ 
  payments, 
  onRefund, 
  onRetry, 
  onViewDetails 
}: PaymentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (status: Payment["status"]) => {
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
  };

  const getMethodIcon = (method: Payment["method"]) => {
    switch (method) {
      case "mpesa":
        return <Smartphone className="h-4 w-4 text-green-600" />;
      case "card":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "bank_transfer":
        return <Banknote className="h-4 w-4 text-purple-600" />;
      case "crypto":
        return <RefreshCw className="h-4 w-4 text-orange-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number, currency: string = "KES") => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const PaymentDetailsDialog = ({ payment }: { payment: Payment }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Payment Details</DialogTitle>
          <DialogDescription>
            Payment ID: {payment.id}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6">
            {/* Payment Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Payment Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{formatCurrency(payment.amount, payment.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Net Amount</p>
                  <p className="font-medium">{formatCurrency(payment.netAmount, payment.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fees</p>
                  <p className="font-medium">{formatCurrency(payment.fees, payment.currency)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(payment.status)}
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Customer Information</h3>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <p className="font-medium">{payment.customerName}</p>
                  <p className="text-sm text-gray-500">{payment.customerEmail}</p>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Payment Method</h3>
              <div className="flex items-center space-x-2">
                {getMethodIcon(payment.method)}
                <span className="font-medium capitalize">{payment.method.replace('_', ' ')}</span>
              </div>
              {payment.transactionId && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-mono text-sm">{payment.transactionId}</p>
                </div>
              )}
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Timeline</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm">Due Date</p>
                    <p className="text-xs text-gray-500">{format(payment.dueDate, "PPP p")}</p>
                  </div>
                </div>
                {payment.paidAt && (
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm">Paid At</p>
                      <p className="text-xs text-gray-500">{format(payment.paidAt, "PPP p")}</p>
                    </div>
                  </div>
                )}
                {payment.nextRetryDate && (
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <div>
                      <p className="text-sm">Next Retry</p>
                      <p className="text-xs text-gray-500">{format(payment.nextRetryDate, "PPP p")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm">{payment.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Loan ID</p>
                  <p className="text-sm font-mono">{payment.loanId}</p>
                </div>
                {payment.retryCount !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Retry Count</p>
                    <p className="text-sm">{payment.retryCount}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
              {payment.status === "completed" && (
                <Button 
                  variant="outline" 
                  onClick={() => onRefund?.(payment.id, payment.amount)}
                >
                  Refund Payment
                </Button>
              )}
              {payment.status === "failed" && (
                <Button 
                  onClick={() => onRetry?.(payment.id)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Payment
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payments</CardTitle>
            <CardDescription>
              Manage and track payment transactions
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="mpesa">M-Pesa</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
              <SelectItem value="crypto">Crypto</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Paid Date</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{payment.customerName}</p>
                      <p className="text-sm text-gray-500">{payment.customerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getMethodIcon(payment.method)}
                      <span className="capitalize text-sm">
                        {payment.method.replace('_', ' ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell>
                    {format(payment.dueDate, "MMM dd, yyyy")}
                  </TableCell>
                  <TableCell>
                    {payment.paidAt ? format(payment.paidAt, "MMM dd, yyyy") : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <PaymentDetailsDialog payment={payment} />
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredPayments.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No payments found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}