'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { 
  MerchantStats, 
  MerchantTransaction, 
  PayoutInfo, 
  QRCodePayment,
  PayWithKeloConfig,
  IntegrationSnippet,
  SalesData,
  CustomerAnalytics
} from '@/types/merchant'

export function useMerchant() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<MerchantStats | null>(null)
  const [transactions, setTransactions] = useState<MerchantTransaction[]>([])
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo[]>([])
  const [qrCodes, setQrCodes] = useState<QRCodePayment[]>([])
  const [config, setConfig] = useState<PayWithKeloConfig | null>(null)
  const [snippets, setSnippets] = useState<IntegrationSnippet[]>([])
  const [salesData, setSalesData] = useState<SalesData[]>([])
  const [customerAnalytics, setCustomerAnalytics] = useState<CustomerAnalytics[]>([])
  const { toast } = useToast()

  const fetchMerchantStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/merchant/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setStats(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch merchant stats',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return null
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchTransactions = useCallback(async (filters?: {
    type?: MerchantTransaction['type']
    status?: MerchantTransaction['status']
    dateFrom?: string
    dateTo?: string
  }) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })
      }

      const response = await fetch(`/api/merchant/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setTransactions(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch transactions',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return []
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchPayoutInfo = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/merchant/payout-info', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setPayoutInfo(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch payout information',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return []
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const createQRCode = useCallback(async (data: {
    amount: number
    description: string
    expiresMinutes?: number
  }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/merchant/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setQrCodes(prev => [result.data, ...prev])
        toast({
          title: 'QR Code Created',
          description: 'QR code has been generated successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Failed to create QR code',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return null
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchQRCode = useCallback(async (qrId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/merchant/qr-codes/${qrId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        toast({
          title: 'Failed to fetch QR code',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return null
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const updatePayoutInfo = useCallback(async (payoutId: string, data: Partial<PayoutInfo>) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/merchant/payout-info/${payoutId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setPayoutInfo(prev => prev.map(p => p.id === payoutId ? result.data : p))
        toast({
          title: 'Payout Information Updated',
          description: 'Your payout information has been updated successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Failed to update payout information',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return null
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const requestPayout = useCallback(async (amount: number, payoutMethodId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/merchant/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          amount,
          payoutMethodId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Payout Requested',
          description: `Payout of KES ${amount.toLocaleString()} has been requested.`,
        })
        return result.data
      } else {
        toast({
          title: 'Failed to request payout',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return null
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchIntegrationConfig = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/merchant/integration-config', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setConfig(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch integration config',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return null
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const generateIntegrationSnippet = useCallback(async (type: IntegrationSnippet['type'], platform: IntegrationSnippet['platform']) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/merchant/integration-snippets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          type,
          platform,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setSnippets(prev => [result.data, ...prev])
        toast({
          title: 'Integration Snippet Generated',
          description: 'Your integration snippet has been generated successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Failed to generate integration snippet',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return null
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    isLoading,
    stats,
    transactions,
    payoutInfo,
    qrCodes,
    config,
    snippets,
    salesData,
    customerAnalytics,
    fetchMerchantStats,
    fetchTransactions,
    fetchPayoutInfo,
    createQRCode,
    fetchQRCode,
    updatePayoutInfo,
    requestPayout,
    fetchIntegrationConfig,
    generateIntegrationSnippet,
  }
}