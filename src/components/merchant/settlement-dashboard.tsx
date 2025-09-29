"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Calendar,
  Banknote,
  CreditCard,
  Smartphone,
  RefreshCw,
  Download,
  Eye
} from "lucide-react";
import { format } from "date-fns";

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

interface SettlementDashboardProps {
  settlements: Settlement[];
  onExportReport?: (settlementId: string) => void;
  onViewDetails?: (settlement: Settlement) => void;
}

export function SettlementDashboard({ 
  settlements, 
  onExportReport, 
  onViewDetails 
}: SettlementDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [stats, setStats] = useState({
    totalSettled: 0,
    pendingSettlement: 0,
    averageSettlementTime: 0,
    successRate: 0,
  });

  useEffect(() => {
    // Calculate stats
    const completedSettlements = settlements.filter(s => s.status === "completed");
    const pendingSettlements = settlements.filter(s => s.status === "pending");
    
    const totalSettled = completedSettlements.reduce((sum, s) => sum + s.netAmount, 0);
    const pendingSettlement = pendingSettlements.reduce((sum, s) => sum + s.netAmount, 0);
    
    const successRate = settlements.length > 0 
      ? (completedSettlements.length / settlements.length) * 100 
      : 0;

    setStats({
      totalSettled,
      pendingSettlement,
      averageSettlementTime: 2.5, // Mock value
      successRate: Math.round(successRate),
    });
  }, [settlements]);

  const currentSettlements = settlements.filter(s => s.status === "pending" || s.status === "processing");
  const completedSettlements = settlements.filter(s => s.status === "completed");

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: Settlement["status"]) => {
    const variants = {
      pending: "secondary",
      processing: "default",
      completed: "default",
      failed: "destructive"
    } as const;

    const labels = {
      pending: "Pending",
      processing: "Processing",
      completed: "Completed",
      failed: "Failed"
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  };

  const getMethodIcon = (method: string) => {
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

  const SettlementCard = ({ settlement }: { settlement: Settlement }) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{settlement.period}</CardTitle>
            <CardDescription>
              {format(settlement.startDate, "MMM dd")} - {format(settlement.endDate, "MMM dd, yyyy")}
            </CardDescription>
          </div>
          {getStatusBadge(settlement.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="font-medium">{formatCurrency(settlement.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Amount</p>
              <p className="font-medium">{formatCurrency(settlement.netAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="font-medium">{settlement.transactionCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fees</p>
              <p className="font-medium">{formatCurrency(settlement.fees)}</p>
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div>
            <p className="text-sm text-gray-500 mb-2">Payment Methods</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(settlement.paymentMethods).map(([method, amount]) => (
                <div key={method} className="flex items-center space-x-2">
                  {getMethodIcon(method)}
                  <span className="text-sm capitalize">{method.replace('_', ' ')}</span>
                  <span className="text-sm font-medium ml-auto">
                    {formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress for processing settlements */}
          {settlement.status === "processing" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Processing Progress</span>
                <span className="text-sm font-medium">75%</span>
              </div>
              <Progress value={75} className="h-2" />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => onExportReport?.(settlement.id)}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm" onClick={() => onViewDetails?.(settlement)}>
              <Eye className="h-4 w-4 mr-2" />
              Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSettled)}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Settlement</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.pendingSettlement)}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Settlement Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageSettlementTime}h</div>
            <p className="text-xs text-muted-foreground">
              Processing time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate}%</div>
            <p className="text-xs text-muted-foreground">
              Settlement success
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Settlements Tabs */}
      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">
            Current Settlements ({currentSettlements.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedSettlements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {currentSettlements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentSettlements.map(settlement => (
                <SettlementCard key={settlement.id} settlement={settlement} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No current settlements</p>
                  <p className="text-sm text-gray-400 mt-2">
                    All settlements have been processed
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedSettlements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedSettlements.map(settlement => (
                <SettlementCard key={settlement.id} settlement={settlement} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No completed settlements</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Settlements will appear here once completed
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Settlement Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement Schedule</CardTitle>
          <CardDescription>
            Upcoming settlement dates and processing timeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium">Next Settlement Date</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "EEEE, MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">In 7 days</Badge>
            </div>
            
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Processing Cutoff</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), "EEEE, MMMM dd, yyyy")}
                  </p>
                </div>
              </div>
              <Badge variant="outline">In 5 days</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}