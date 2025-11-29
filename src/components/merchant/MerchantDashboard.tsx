'use client'

import { useQuery } from '@tanstack/react-query'
import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { 
  TrendingUp, 
  Users, 
  DollarSign,
  CreditCard,
  Download,
  Plus,
  ArrowUpRight,
  BarChart3,
  Activity,
  Loader2,
  AlertTriangle
} from 'lucide-react'

// Define types for our fetched data
type SalesAnalytics = {
  total_revenue: number;
  sales_volume: number;
  top_selling_products: any[]; // Define more specific type if needed
};

type Payout = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
};

type MerchantOrder = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  user_id: string;
};


// Fetcher functions
const fetchSalesAnalytics = async (): Promise<SalesAnalytics> => {
  const response = await fetch('/api/merchant/analytics')
  if (!response.ok) {
    throw new Error('Failed to fetch sales analytics')
  }
  return response.json()
}

const fetchPayoutHistory = async (): Promise<Payout[]> => {
  const response = await fetch('/api/merchant/payouts')
  if (!response.ok) {
    throw new Error('Failed to fetch payout history')
  }
  return response.json()
}

import { getRecentOrders } from '@/services/merchant'


export function MerchantDashboard() {
  const { user, profile, supabase, isLoading: isUserLoading } = useUser()

  const { data: analytics, isLoading: isAnalyticsLoading, error: analyticsError } = useQuery<SalesAnalytics>(
    'salesAnalytics',
    fetchSalesAnalytics,
    { enabled: !!user && profile?.role === 'merchant' }
  )

  const { data: payouts, isLoading: isPayoutsLoading, error: payoutsError } = useQuery<Payout[]>(
    'payoutHistory',
    fetchPayoutHistory,
    { enabled: !!user && profile?.role === 'merchant' }
  )

  const { data: orders, isLoading: isOrdersLoading, error: ordersError } = useQuery<MerchantOrder[]>(
      ['recentOrders'],
      getRecentOrders,
      { enabled: !!user && profile?.role === 'merchant' }
  )


  if (analyticsError) {
    toast.error((analyticsError as Error).message)
  }
  if (payoutsError) {
    toast.error((payoutsError as Error).message)
  }
  if (ordersError) {
      toast.error((ordersError as Error).message)
  }

  const payoutBalance = payouts
    ?.filter(p => p.status === 'completed')
    .reduce((acc, p) => acc - p.amount, analytics?.total_revenue || 0)

  const isLoading = isUserLoading || isAnalyticsLoading || isPayoutsLoading || isOrdersLoading;

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
    })
  }

  if (isUserLoading || isLoading) {
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

  if (profile?.role !== 'merchant') {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
              <p className="text-muted-foreground">This dashboard is only for merchant accounts.</p>
          </div>
      )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Merchant Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Welcome back, {profile.first_name}! Here's your business overview.
          </p>
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
              {analytics ? formatCurrency(analytics.total_revenue) : <Loader2 className="animate-spin h-6 w-6"/>}
            </div>
            <p className="text-xs text-muted-foreground">
              Based on completed orders.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales Volume</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.sales_volume?.toLocaleString() ?? <Loader2 className="animate-spin h-6 w-6"/>}
            </div>
            <p className="text-xs text-muted-foreground">
              Total number of sales.
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
              {payoutBalance !== undefined ? formatCurrency(payoutBalance) : <Loader2 className="animate-spin h-6 w-6"/>}
            </div>
            <p className="text-xs text-muted-foreground">
              Available for withdrawal.
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
              12.5%
            </div>
            <p className="text-xs text-muted-foreground">
              (Placeholder)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Recent Orders</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>
                A list of the latest orders from your stores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orders && orders.length > 0 ? orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <ArrowUpRight className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="font-medium">Order from user <span className="font-mono text-xs">{order.user_id.substring(0,8)}...</span></p>
                        <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="flex items-center justify-end space-x-2">
                        <span className="font-semibold">{formatCurrency(order.total_amount)}</span>
                        <Badge>{order.status}</Badge>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-muted-foreground italic">No recent orders found.</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Performance Metrics
              </CardTitle>
              <CardDescription>
                Key performance indicators for your stores.
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
                    <span>12.5%</span>
                  </div>
                  <Progress value={12.5} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}