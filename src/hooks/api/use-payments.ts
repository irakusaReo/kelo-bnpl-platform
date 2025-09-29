'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface PaymentFilters {
  status?: 'pending' | 'completed' | 'failed'
  method?: 'mpesa' | 'bank-transfer' | 'crypto' | 'wallet'
  dateFrom?: string
  dateTo?: string
}

interface PaymentData {
  id: string
  amount: number
  method: string
  status: string
  loanId: string
  createdAt: string
  transactionId?: string
}

export function usePayments() {
  const [isLoading, setIsLoading] = useState(false)
  const [payments, setPayments] = useState<PaymentData[]>([])
  const { toast } = useToast()

  const fetchPayments = useCallback(async (filters?: PaymentFilters) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })
      }

      const response = await fetch(`/api/payments?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setPayments(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch payments',
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

  const getWalletBalance = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        return result.data.balance
      } else {
        toast({
          title: 'Failed to fetch wallet balance',
          description: result.message || 'Please try again later.',
          variant: 'destructive',
        })
        return 0
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return 0
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    payments,
    isLoading,
    fetchPayments,
    getWalletBalance,
  }
}