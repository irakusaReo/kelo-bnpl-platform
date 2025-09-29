'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useWallet } from '@/hooks/blockchain/useWallet'
import { WalletConnection } from '@/types/blockchain/wallet'
import { NETWORKS } from '@/utils/constants/blockchain'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  RefreshCw,
  ExternalLink,
  Copy
} from 'lucide-react'

interface WalletBalanceProps {
  className?: string
  showDetails?: boolean
}

export default function WalletBalance({ className, showDetails = false }: WalletBalanceProps) {
  const { connection, switchNetwork, isLoading } = useWallet()
  const [balanceHistory, setBalanceHistory] = useState<{ amount: string; timestamp: number }[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (connection) {
      // Simulate balance history for demo purposes
      const history = [
        { amount: connection.balance, timestamp: Date.now() },
        { amount: (parseFloat(connection.balance) * 0.95).toString(), timestamp: Date.now() - 86400000 },
        { amount: (parseFloat(connection.balance) * 1.1).toString(), timestamp: Date.now() - 172800000 },
      ]
      setBalanceHistory(history)
    }
  }, [connection])

  const refreshBalance = async () => {
    if (!connection) return

    setIsRefreshing(true)
    try {
      // In a real implementation, this would fetch the latest balance from the blockchain
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update balance history
      setBalanceHistory(prev => [
        { amount: connection.balance, timestamp: Date.now() },
        ...prev.slice(0, 2)
      ])
    } catch (error) {
      console.error('Failed to refresh balance:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatBalance = (balance: string, decimals: number = 18): string => {
    try {
      const balanceInEther = parseFloat(balance) / Math.pow(10, decimals)
      return balanceInEther.toFixed(6)
    } catch (error) {
      return '0.000000'
    }
  }

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getBalanceChange = () => {
    if (balanceHistory.length < 2) return 0
    const current = parseFloat(balanceHistory[0].amount)
    const previous = parseFloat(balanceHistory[1].amount)
    return ((current - previous) / previous) * 100
  }

  const getNetworkInfo = () => {
    if (!connection) return null
    
    const networkKey = Object.keys(NETWORKS).find(
      key => NETWORKS[key as keyof typeof NETWORKS].name.toLowerCase().includes(connection.network.toLowerCase())
    )
    
    return networkKey ? NETWORKS[networkKey as keyof typeof NETWORKS] : null
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const openInExplorer = (address: string) => {
    const networkInfo = getNetworkInfo()
    if (networkInfo) {
      window.open(`${networkInfo.blockExplorer}/address/${address}`, '_blank')
    }
  }

  if (!connection) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Wallet Balance</span>
          </CardTitle>
          <CardDescription>Connect your wallet to view balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No wallet connected
          </div>
        </CardContent>
      </Card>
    )
  }

  const balanceChange = getBalanceChange()
  const networkInfo = getNetworkInfo()
  const isPositive = balanceChange > 0

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5" />
              <span>Wallet Balance</span>
            </CardTitle>
            <CardDescription>
              {connection.network} Network
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshBalance}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Balance Display */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-3xl font-bold">
              {formatBalance(connection.balance)} {networkInfo?.currency || 'ETH'}
            </span>
            {balanceHistory.length > 1 && (
              <Badge variant={isPositive ? 'default' : 'destructive'} className="flex items-center space-x-1">
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                <span>{Math.abs(balanceChange).toFixed(2)}%</span>
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            ≈ ${(parseFloat(formatBalance(connection.balance)) * 2000).toLocaleString()} USD
          </p>
        </div>

        {/* Network and Address */}
        {showDetails && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{connection.network}</Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => switchNetwork('ethereum' as any)}
                  disabled={isLoading}
                >
                  Switch
                </Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Address</span>
              <div className="flex items-center space-x-2">
                <code className="bg-muted px-2 py-1 rounded text-sm">
                  {formatAddress(connection.address)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(connection.address)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openInExplorer(connection.address)}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {networkInfo && (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Chain ID</span>
                  <div className="font-medium">{networkInfo.chainId}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Currency</span>
                  <div className="font-medium">{networkInfo.currency}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Balance History */}
        {showDetails && balanceHistory.length > 1 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-sm font-medium">Balance History</h4>
            <div className="space-y-2">
              {balanceHistory.slice(1).map((record, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </span>
                  <span className="font-medium">
                    {formatBalance(record.amount)} {networkInfo?.currency || 'ETH'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}