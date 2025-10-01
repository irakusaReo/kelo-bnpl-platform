'use client'

import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Loader2, DollarSign, Landmark, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'

// Define a simple type for the data we'll fetch
type DashboardStats = {
  total_loans: number;
  active_loans: number;
  total_staked: number;
}

export function UserDashboard() {
  const { user, profile, supabase, isLoading: isUserLoading } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !supabase) return

      setIsStatsLoading(true)

      // Fetch loan counts
      const { count: totalLoans, error: totalLoansError } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: activeLoans, error: activeLoansError } = await supabase
        .from('loans')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Fetch total staked amount
      const { data: investments, error: investmentsError } = await supabase
        .from('user_investments')
        .select('staked_amount')
        .eq('user_id', user.id)

      if (totalLoansError || activeLoansError || investmentsError) {
        console.error("Error fetching dashboard stats:", totalLoansError || activeLoansError || investmentsError)
      } else {
        const totalStaked = investments.reduce((acc, i) => acc + i.staked_amount, 0)
        setStats({
          total_loans: totalLoans ?? 0,
          active_loans: activeLoans ?? 0,
          total_staked: totalStaked,
        })
      }
      setIsStatsLoading(false)
    }

    if (user) {
      fetchDashboardData()
    }
  }, [user, supabase])

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div className="text-center p-8">
        <h1 className="text-2xl font-bold">Not Authenticated</h1>
        <p>Please log in to view your dashboard.</p>
      </div>
    )
  }

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase()
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} />
            <AvatarFallback>
              {getInitials(profile.first_name ?? '', profile.last_name ?? '')}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Welcome back, {profile.first_name || user.email}!
            </h1>
            <p className="text-muted-foreground">Here is your financial overview.</p>
          </div>
        </div>
        <Badge variant={profile.role === 'merchant' ? 'destructive' : 'default'} className="capitalize">
          {profile.role}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">{stats?.total_loans}</div>
            )}
            <p className="text-xs text-muted-foreground">{stats?.active_loans} currently active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <div className="text-2xl font-bold">
                KSH {stats?.total_staked.toLocaleString() ?? '0'}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Across all liquidity pools</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile.wallet_address ? 'Connected' : 'Not Connected'}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {profile.wallet_address ?? 'Connect your wallet in settings'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for more dashboard components */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              A list of your recent loans and transactions will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground italic">Coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}