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
import { useWallet } from '@/hooks/blockchain/useWallet'
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  Wallet,
  BarChart3,
  Coins,
  Lock,
  Unlock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Percent
} from 'lucide-react'
import type { StakingPool, UserStake } from '@/types/dashboard'

// Mock data for demonstration
const mockStakingPools: StakingPool[] = [
  {
    id: '1',
    name: 'USDC Stable Pool',
    chain: 'ethereum',
    token: 'USDC',
    apy: 8.5,
    totalStaked: 2500000,
    tvl: 2500000,
    minStake: 100,
    maxStake: 100000,
    lockPeriod: 30,
    riskLevel: 'low'
  },
  {
    id: '2',
    name: 'USDT Polygon Pool',
    chain: 'polygon',
    token: 'USDT',
    apy: 12.3,
    totalStaked: 1800000,
    tvl: 1800000,
    minStake: 50,
    maxStake: 50000,
    lockPeriod: 7,
    riskLevel: 'low'
  },
  {
    id: '3',
    name: 'DAI Hedera Pool',
    chain: 'hedera',
    token: 'DAI',
    apy: 15.7,
    totalStaked: 900000,
    tvl: 900000,
    minStake: 25,
    maxStake: 25000,
    lockPeriod: 14,
    riskLevel: 'medium'
  },
  {
    id: '4',
    name: 'BUSD BSC Pool',
    chain: 'binance',
    token: 'BUSD',
    apy: 10.2,
    totalStaked: 3200000,
    tvl: 3200000,
    minStake: 75,
    maxStake: 75000,
    lockPeriod: 21,
    riskLevel: 'low'
  }
]

const mockUserStakes: UserStake[] = [
  {
    id: '1',
    poolId: '1',
    amount: 5000,
    stakedAt: '2024-01-15T10:30:00Z',
    rewards: 356.25,
    isActive: true,
    estimatedApy: 8.5
  },
  {
    id: '2',
    poolId: '2',
    amount: 2500,
    stakedAt: '2024-02-01T14:15:00Z',
    rewards: 256.25,
    isActive: true,
    estimatedApy: 12.3
  }
]

export function StakingInterface() {
  const { toast } = useToast()
  const { wallet, isConnected } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [stakingPools, setStakingPools] = useState<StakingPool[]>(mockStakingPools)
  const [userStakes, setUserStakes] = useState<UserStake[]>(mockUserStakes)
  const [selectedPool, setSelectedPool] = useState<StakingPool | null>(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [isStaking, setIsStaking] = useState(false)
  const [isUnstaking, setIsUnstaking] = useState(false)

  const getRiskLevelColor = (riskLevel: StakingPool['riskLevel']) => {
    switch (riskLevel) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getChainIcon = (chain: StakingPool['chain']) => {
    switch (chain) {
      case 'ethereum': return '🔷'
      case 'polygon': return '🟣'
      case 'hedera': return '🟢'
      case 'binance': return '🟡'
      default: return '⚪'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDaysStaked = (stakedAt: string) => {
    const staked = new Date(stakedAt)
    const now = new Date()
    const diffTime = now.getTime() - staked.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleStake = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to stake tokens.',
        variant: 'destructive',
      })
      return
    }

    if (!selectedPool || !stakeAmount) {
      toast({
        title: 'Invalid Input',
        description: 'Please select a pool and enter a valid amount.',
        variant: 'destructive',
      })
      return
    }

    const amount = parseFloat(stakeAmount)
    if (amount < selectedPool.minStake || amount > selectedPool.maxStake) {
      toast({
        title: 'Invalid Amount',
        description: `Amount must be between ${formatCurrency(selectedPool.minStake)} and ${formatCurrency(selectedPool.maxStake)}.`,
        variant: 'destructive',
      })
      return
    }

    setIsStaking(true)
    try {
      // Simulate staking process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const newStake: UserStake = {
        id: Date.now().toString(),
        poolId: selectedPool.id,
        amount,
        stakedAt: new Date().toISOString(),
        rewards: 0,
        isActive: true,
        estimatedApy: selectedPool.apy
      }

      setUserStakes(prev => [...prev, newStake])
      
      // Update pool total staked
      setStakingPools(prev => prev.map(pool => 
        pool.id === selectedPool.id 
          ? { ...pool, totalStaked: pool.totalStaked + amount }
          : pool
      ))

      toast({
        title: 'Staking Successful',
        description: `Successfully staked ${formatCurrency(amount)} in ${selectedPool.name}.`,
      })

      setStakeAmount('')
      setSelectedPool(null)
    } catch (error) {
      toast({
        title: 'Staking Failed',
        description: 'Failed to stake tokens. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsStaking(false)
    }
  }

  const handleUnstake = async (stakeId: string) => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to unstake tokens.',
        variant: 'destructive',
      })
      return
    }

    setIsUnstaking(true)
    try {
      // Simulate unstaking process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      const stake = userStakes.find(s => s.id === stakeId)
      if (!stake) return

      setUserStakes(prev => prev.map(s => 
        s.id === stakeId 
          ? { ...s, isActive: false, unstakedAt: new Date().toISOString() }
          : s
      ))

      // Update pool total staked
      setStakingPools(prev => prev.map(pool => 
        pool.id === stake.poolId 
          ? { ...pool, totalStaked: pool.totalStaked - stake.amount }
          : pool
      ))

      toast({
        title: 'Unstaking Successful',
        description: `Successfully unstaked ${formatCurrency(stake.amount)}.`,
      })
    } catch (error) {
      toast({
        title: 'Unstaking Failed',
        description: 'Failed to unstake tokens. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUnstaking(false)
    }
  }

  const totalStaked = userStakes
    .filter(stake => stake.isActive)
    .reduce((sum, stake) => sum + stake.amount, 0)

  const totalRewards = userStakes
    .filter(stake => stake.isActive)
    .reduce((sum, stake) => sum + stake.rewards, 0)

  const averageApy = userStakes.length > 0
    ? userStakes.reduce((sum, stake) => sum + stake.estimatedApy, 0) / userStakes.length
    : 0

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Staking Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Stake stablecoins and earn rewards across multiple blockchain networks
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalStaked)}</div>
            <p className="text-xs text-muted-foreground">
              Across {userStakes.filter(s => s.isActive).length} pools
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRewards)}</div>
            <p className="text-xs text-muted-foreground">
              Earned so far
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average APY</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageApy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Weighted average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Status</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            <p className="text-xs text-muted-foreground">
              {wallet?.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'No wallet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="pools" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pools">Available Pools</TabsTrigger>
          <TabsTrigger value="my-stakes">My Stakes</TabsTrigger>
          <TabsTrigger value="stake">Stake Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="pools" className="space-y-4">
          <div className="grid gap-4">
            {stakingPools.map((pool) => (
              <Card key={pool.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getChainIcon(pool.chain)}</span>
                      <div>
                        <CardTitle className="text-lg">{pool.name}</CardTitle>
                        <CardDescription>
                          {pool.token} • {pool.chain.charAt(0).toUpperCase() + pool.chain.slice(1)}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{pool.apy}%</div>
                      <p className="text-sm text-gray-500">APY</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">TVL</p>
                      <p className="font-semibold">{formatCurrency(pool.tvl)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Min Stake</p>
                      <p className="font-semibold">{formatCurrency(pool.minStake)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Lock Period</p>
                      <p className="font-semibold">{pool.lockPeriod} days</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Risk Level</p>
                      <Badge className={getRiskLevelColor(pool.riskLevel)}>
                        {pool.riskLevel.charAt(0).toUpperCase() + pool.riskLevel.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pool Utilization</span>
                      <span>{((pool.totalStaked / pool.tvl) * 100).toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={(pool.totalStaked / pool.tvl) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      {formatCurrency(pool.totalStaked)} staked by {Math.floor(pool.totalStaked / 1000)}+ users
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        setSelectedPool(pool)
                        document.querySelector('[value="stake"]')?.setAttribute('data-state', 'active')
                      }}
                    >
                      Stake Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-stakes" className="space-y-4">
          <div className="grid gap-4">
            {userStakes.filter(stake => stake.isActive).length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Lock className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Stakes</h3>
                  <p className="text-gray-500 text-center mb-4">
                    You don't have any active stakes. Start staking to earn rewards.
                  </p>
                  <Button onClick={() => {
                    document.querySelector('[value="pools"]')?.setAttribute('data-state', 'active')
                  }}>
                    Browse Pools
                  </Button>
                </CardContent>
              </Card>
            ) : (
              userStakes
                .filter(stake => stake.isActive)
                .map((stake) => {
                  const pool = stakingPools.find(p => p.id === stake.poolId)
                  if (!pool) return null

                  return (
                    <Card key={stake.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getChainIcon(pool.chain)}</span>
                            <div>
                              <CardTitle className="text-lg">{pool.name}</CardTitle>
                              <CardDescription>
                                Staked {formatDate(stake.stakedAt)}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Staked Amount</p>
                            <p className="font-semibold">{formatCurrency(stake.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Rewards Earned</p>
                            <p className="font-semibold text-green-600">{formatCurrency(stake.rewards)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">APY</p>
                            <p className="font-semibold">{stake.estimatedApy}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Days Staked</p>
                            <p className="font-semibold">{getDaysStaked(stake.stakedAt)}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              Lock period: {pool.lockPeriod} days
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleUnstake(stake.id)}
                            disabled={isUnstaking}
                          >
                            <Unlock className="h-4 w-4 mr-2" />
                            Unstake
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
            )}
          </div>
        </TabsContent>

        <TabsContent value="stake" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stake Tokens</CardTitle>
              <CardDescription>
                Select a pool and enter the amount you want to stake
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pool-select">Select Pool</Label>
                <Select onValueChange={(value) => {
                  const pool = stakingPools.find(p => p.id === value)
                  setSelectedPool(pool || null)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a staking pool" />
                  </SelectTrigger>
                  <SelectContent>
                    {stakingPools.map((pool) => (
                      <SelectItem key={pool.id} value={pool.id}>
                        <div className="flex items-center space-x-2">
                          <span>{getChainIcon(pool.chain)}</span>
                          <span>{pool.name} - {pool.apy}% APY</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedPool && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount ({selectedPool.token})</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount to stake"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      min={selectedPool.minStake}
                      max={selectedPool.maxStake}
                    />
                    <p className="text-sm text-gray-500">
                      Min: {formatCurrency(selectedPool.minStake)} • Max: {formatCurrency(selectedPool.maxStake)}
                    </p>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Pool Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">APY:</span>
                        <span className="ml-2 font-semibold">{selectedPool.apy}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Lock Period:</span>
                        <span className="ml-2 font-semibold">{selectedPool.lockPeriod} days</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Risk Level:</span>
                        <Badge className={`ml-2 ${getRiskLevelColor(selectedPool.riskLevel)}`}>
                          {selectedPool.riskLevel}
                        </Badge>
                      </div>
                      <div>
                        <span className="text-gray-500">TVL:</span>
                        <span className="ml-2 font-semibold">{formatCurrency(selectedPool.tvl)}</span>
                      </div>
                    </div>
                  </div>

                  {stakeAmount && (
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-green-800">Estimated Rewards</h4>
                      <div className="text-sm text-green-700">
                        <p>Daily: {formatCurrency((parseFloat(stakeAmount) * selectedPool.apy) / 36500)}</p>
                        <p>Monthly: {formatCurrency((parseFloat(stakeAmount) * selectedPool.apy) / 1200)}</p>
                        <p>Yearly: {formatCurrency((parseFloat(stakeAmount) * selectedPool.apy) / 100)}</p>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={handleStake}
                    disabled={!stakeAmount || isStaking || !isConnected}
                  >
                    {isStaking ? 'Staking...' : `Stake ${stakeAmount ? formatCurrency(parseFloat(stakeAmount)) : 'Tokens'}`}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}