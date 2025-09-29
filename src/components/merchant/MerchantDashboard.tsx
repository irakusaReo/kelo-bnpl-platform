'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { useMerchant } from '@/hooks/use-merchant'
import { useSocket } from '@/lib/socket/socket-provider'
import { 
  TrendingUp, 
  Users, 
  CreditCard, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Eye,
  Settings,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { MerchantTransaction, PayoutInfo } from '@/types/merchant'

// Mock data for demonstration
const mockRecentTransactions: MerchantTransaction[] = [
  {
    id: '1',
    type: 'sale',
    amount: 15000,
    currency: 'KES',
    status: 'completed',
    description: 'Online Purchase - Electronics',
    customer: {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    },
    orderId: 'ORD-001',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    processedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    fee: 450,
    netAmount: 14550
  },
  {
    id: '2',
    type: 'sale',
    amount: 8500,
    currency: 'KES',
    status: 'completed',
    description: 'In-store Purchase - Clothing',
    customer: {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com'
    },
    orderId: 'ORD-002',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    processedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    fee: 255,
    netAmount: 8245
  },
  {
    id: '3',
    type: 'payout',
    amount: 50000,
    currency: 'KES',
    status: 'processing',
    description: 'Weekly Payout',
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    fee: 0,
    netAmount: 50000
  },
  {
    id: '4',
    type: 'sale',
    amount: 25000,
    currency: 'KES',
    status: 'pending',
    description: 'Online Purchase - Furniture',
    customer: {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com'
    },
    orderId: 'ORD-003',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    fee: 750,
    netAmount: 24250
  }
]

const mockPayoutMethods: PayoutInfo[] = [
  {
    id: '1',
    bankAccount: {
      bankName: 'Equity Bank',
      accountNumber: '****1234',
      accountHolder: 'Your Business Name'
    },
    isDefault: true,
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    mobileMoney: {
      provider: 'M-Pesa',
      phoneNumber: '+2547****1234'
    },
    isDefault: false,
    status: 'active',
    createdAt: '2024-02-01T14:15:00Z'
  }
]

export function MerchantDashboard() {
  const { toast } = useToast()
  const { isConnected, lastMessage } = useSocket()
  const {
    isLoading,
    stats,
    transactions,
    payoutInfo,
    fetchMerchantStats,
    fetchTransactions,
    fetchPayoutInfo,
    requestPayout,
  } = useMerchant()

  const [recentTransactions, setRecentTransactions] = useState(mockRecentTransactions)
  const [payoutMethods, setPayoutMethods] = useState(mockPayoutMethods)
  const [isRequestingPayout, setIsRequestingPayout] = useState(false)
  const [payoutAmount, setPayoutAmount] = useState('')

  useEffect(() => {
    const loadDashboardData = async () => {
      await Promise.all([
        fetchMerchantStats(),
        fetchTransactions(),
        fetchPayoutInfo(),
      ])
    }

    loadDashboardData()
  }, [fetchMerchantStats, fetchTransactions, fetchPayoutInfo])

  useEffect(() => {
    // Handle real-time socket messages
    if (lastMessage) {
      console.log("Received socket message:", lastMessage)
      if (lastMessage.type === "new_transaction") {
        setRecentTransactions(prev => [lastMessage.data, ...prev])
      }
    }
  }, [lastMessage])

  const getTransactionStatusColor = (status: MerchantTransaction['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTransactionTypeIcon = (type: MerchantTransaction['type']) => {
    switch (type) {
      case 'sale': return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'refund': return <ArrowDownRight className="h-4 w-4 text-red-600" />
      case 'payout': return <ArrowDownRight className="h-4 w-4 text-blue-600" />
      case 'fee': return <CreditCard className="h-4 w-4 text-gray-600" />
      default: return <CreditCard className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleRequestPayout = async () => {
    if (!payoutAmount || !payoutMethods.find(m => m.isDefault)) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid amount and ensure you have a default payout method.',
        variant: 'destructive',
      })
      return
    }

    const amount = parseFloat(payoutAmount)
    if (amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payout amount.',
        variant: 'destructive',
      })
      return
    }

    if (stats && amount > stats.payoutBalance) {
      toast({
        title: 'Insufficient Balance',
        description: 'Payout amount exceeds available balance.',
        variant: 'destructive',
      })
      return
    }

    setIsRequestingPayout(true)
    try {
      const defaultMethod = payoutMethods.find(m => m.isDefault)
      if (defaultMethod) {
        await requestPayout(amount, defaultMethod.id)
        setPayoutAmount('')
        // Refresh data
        await fetchMerchantStats()
      }
    } finally {
      setIsRequestingPayout(false)
    }
  }

  if (isLoading && !stats) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
                <Skeleton className="h-3 w-20 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Merchant Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Welcome back! Here's your business overview
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
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.totalRevenue) : 'KES 0'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats && `+${stats.monthlyGrowth}% from last month`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.activeCustomers.toLocaleString() || '0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Using BNPL services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payout Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatCurrency(stats.payoutBalance) : 'KES 0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for withdrawal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? `${stats.conversionRate}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              BNPL adoption rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>
                  Latest sales, refunds, and payouts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionTypeIcon(transaction.type)}
                        <div>
                          <p className="font-medium">{transaction.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{transaction.customer?.name}</span>
                            <span>•</span>
                            <span>{formatDate(transaction.createdAt)}</span>
                            {transaction.orderId && (
                              <>
                                <span>•</span>
                                <span className="font-mono">{transaction.orderId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="flex items-center justify-end space-x-2">
                          <span className="font-semibold">
                            {transaction.type === 'sale' || transaction.type === 'fee' ? '+' : '-'}
                            {formatCurrency(transaction.amount)}
                          </span>
                          <Badge className={getTransactionStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                        {transaction.netAmount && (
                          <p className="text-sm text-gray-500">
                            Net: {formatCurrency(transaction.netAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Request Payout</CardTitle>
                <CardDescription>
                  Withdraw funds to your configured payout methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payout-amount">Amount (KES)</Label>
                    <Input
                      id="payout-amount"
                      type="number"
                      placeholder="Enter amount to withdraw"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      min={0}
                      max={stats?.payoutBalance || 0}
                    />
                    <p className="text-sm text-gray-500">
                      Available balance: {stats ? formatCurrency(stats.payoutBalance) : 'KES 0'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Payout Method</Label>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">
                            {payoutMethods.find(m => m.isDefault)?.bankAccount?.bankName || 
                             payoutMethods.find(m => m.isDefault)?.mobileMoney?.provider}
                          </p>
                          <p className="text-sm text-gray-500">
                            {payoutMethods.find(m => m.isDefault)?.bankAccount?.accountNumber ||
                             payoutMethods.find(m => m.isDefault)?.mobileMoney?.phoneNumber}
                          </p>
                        </div>
                        <Badge>Default</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleRequestPayout}
                  disabled={!payoutAmount || isRequestingPayout || !payoutMethods.find(m => m.isDefault)}
                  className="w-full"
                >
                  {isRequestingPayout ? 'Processing...' : 'Request Payout'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout Methods</CardTitle>
                <CardDescription>
                  Your configured payout methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payoutMethods.map((method) => (
                    <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium">
                            {method.bankAccount?.bankName || method.mobileMoney?.provider}
                          </p>
                          {method.isDefault && <Badge>Default</Badge>}
                          <Badge className={method.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                            {method.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {method.bankAccount?.accountNumber || method.mobileMoney?.phoneNumber}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Transaction Types
                  </CardTitle>
                  <CardDescription>
                    Breakdown of transaction types this month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="h-3 w-3 bg-green-500 rounded-full"></div>
                        <span>Sales</span>
                      </span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="h-3 w-3 bg-blue-500 rounded-full"></div>
                        <span>Payouts</span>
                      </span>
                      <span className="font-semibold">12%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center space-x-2">
                        <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                        <span>Refunds</span>
                      </span>
                      <span className="font-semibold">3%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Key performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Customer Satisfaction</span>
                        <span>94%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Payment Success Rate</span>
                        <span>98%</span>
                      </div>
                      <Progress value={98} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>BNPL Adoption</span>
                        <span>{stats?.conversionRate || 0}%</span>
                      </div>
                      <Progress value={stats?.conversionRate || 0} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common merchant tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex-col">
                    <CreditCard className="h-6 w-6 mb-2" />
                    Generate QR Code
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Settings className="h-6 w-6 mb-2" />
                    Integration Setup
                  </Button>
                  <Button variant="outline" className="h-20 flex-col">
                    <Eye className="h-6 w-6 mb-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}