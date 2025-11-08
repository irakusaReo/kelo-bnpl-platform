'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface TransactionData {
  id: string
  hash: string
  from: string
  to: string
  amount: number
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: string
  network: string
  type: 'transfer' | 'loan' | 'payment' | 'deposit'
}

export function useTransactions() {
  const [isLoading, setIsLoading] = useState(false)
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const { toast } = useToast()

  const createTransaction = useCallback(async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/blockchain/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Transaction Created',
          description: 'Your transaction has been created successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Transaction Failed',
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

  const getTransactions = useCallback(async (filters?: any) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value))
        })
      }

      const response = await fetch(`/api/blockchain/transactions?${params}`, {
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

  const getTransactionStatus = useCallback(async (transactionId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/blockchain/transactions/${transactionId}/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        toast({
          title: 'Failed to fetch transaction status',
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
    transactions,
    isLoading,
    createTransaction,
    getTransactions,
    getTransactionStatus,
  }
}
