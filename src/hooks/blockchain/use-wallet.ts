'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface WalletData {
  address: string
  balance: number
  network: string
  type: string
}

interface TransactionData {
  id: string
  hash: string
  from: string
  to: string
  amount: number
  status: 'pending' | 'confirmed' | 'failed'
  timestamp: string
  network: string
}

export function useWallet() {
  const [isLoading, setIsLoading] = useState(false)
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [transactions, setTransactions] = useState<TransactionData[]>([])
  const { toast } = useToast()

  const createWallet = useCallback(async (network: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/blockchain/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ network }),
      })

      const result = await response.json()

      if (result.success) {
        setWallet(result.data)
        toast({
          title: 'Wallet Created',
          description: 'Your blockchain wallet has been created successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Wallet Creation Failed',
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

  const getWalletInfo = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/blockchain/wallet', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setWallet(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch wallet info',
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

  const getTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/blockchain/transactions', {
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

  return {
    wallet,
    transactions,
    isLoading,
    createWallet,
    getWalletInfo,
    getTransactions,
  }
}