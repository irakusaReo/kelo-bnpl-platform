'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useWallet } from '@/hooks/blockchain/useWallet'
import { WalletTransaction } from '@/types/blockchain/wallet'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Search,
  Filter,
  ExternalLink,
  Copy
} from 'lucide-react'

interface TransactionHistoryProps {
  className?: string
  maxItems?: number
  showFilters?: boolean
}

export default function TransactionHistory({ className, maxItems, showFilters = false }: TransactionHistoryProps) {
  const { connection, transactions } = useWallet()
  const [filteredTransactions, setFilteredTransactions] = useState<WalletTransaction[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let filtered = [...transactions]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.hash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter)
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => {
        if (typeFilter === 'sent') return tx.from === connection?.address
        if (typeFilter === 'received') return tx.to === connection?.address
        return true
      })
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp)

    // Limit items if specified
    if (maxItems) {
      filtered = filtered.slice(0, maxItems)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, statusFilter, typeFilter, connection?.address, maxItems])

  const refreshTransactions = async () => {
    setIsRefreshing(true)
    try {
      // In a real implementation, this would fetch the latest transactions from the blockchain
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Failed to refresh transactions:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatAmount = (amount: string): string => {
    try {
      const amountInEther = parseFloat(amount) / Math.pow(10, 18)
      return amountInEther.toFixed(6)
    } catch (error) {
      return '0.000000'
    }
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary',
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getTransactionType = (transaction: WalletTransaction) => {
    if (!connection) return 'unknown'
    
    if (transaction.from.toLowerCase() === connection.address.toLowerCase()) {
      return 'sent'
    } else if (transaction.to.toLowerCase() === connection.address.toLowerCase()) {
      return 'received'
    }
    return 'other'
  }

  const getTransactionIcon = (transaction: WalletTransaction) => {
    const type = getTransactionType(transaction)
    
    if (type === 'sent') {
      return <ArrowUpRight className="w-4 h-4 text-red-500" />
    } else if (type === 'received') {
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />
    }
    return <Clock className="w-4 h-4 text-gray-500" />
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const openInExplorer = (hash: string) => {
    if (connection) {
      let baseUrl = 'https://etherscan.io'
      if (connection.network.toLowerCase().includes('polygon')) {
        baseUrl = 'https://polygonscan.com'
      } else if (connection.network.toLowerCase().includes('hedera')) {
        baseUrl = 'https://hashscan.io'
      }
      window.open(`${baseUrl}/tx/${hash}`, '_blank')
    }
  }

  if (!connection) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Connect your wallet to view transaction history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No wallet connected
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              Your recent blockchain transactions
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={refreshTransactions}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="received">Received</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Transaction Table */}
        {filteredTransactions.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Hash</TableHead>
                  <TableHead>From/To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.hash}>
                    <TableCell>
                      {getTransactionIcon(transaction)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatAddress(transaction.hash)}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-muted-foreground">
                          {getTransactionType(transaction) === 'sent' ? 'To:' : 'From:'}
                        </div>
                        <div className="font-medium">
                          {formatAddress(
                            getTransactionType(transaction) === 'sent' 
                              ? transaction.to 
                              : transaction.from
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">
                          {formatAmount(transaction.value)} ETH
                        </div>
                        <div className="text-muted-foreground">
                          ≈ ${(parseFloat(formatAmount(transaction.value)) * 2000).toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(transaction.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(transaction.hash)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openInExplorer(transaction.hash)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
              ? 'No transactions match your filters'
              : 'No transactions found'
            }
          </div>
        )}

        {/* Summary Stats */}
        {!maxItems && filteredTransactions.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold">{filteredTransactions.length}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {filteredTransactions.filter(tx => getTransactionType(tx) === 'received').length}
              </div>
              <div className="text-sm text-muted-foreground">Received</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">
                {filteredTransactions.filter(tx => getTransactionType(tx) === 'sent').length}
              </div>
              <div className="text-sm text-muted-foreground">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {filteredTransactions.filter(tx => tx.status === 'success').length}
              </div>
              <div className="text-sm text-muted-foreground">Success</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}