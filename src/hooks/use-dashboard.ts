'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { DashboardStats, Loan, PaymentSchedule, Transaction } from '@/types/dashboard'

export function useDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activeLoans, setActiveLoans] = useState<Loan[]>([])
  const [paymentSchedule, setPaymentSchedule] = useState<PaymentSchedule[]>([])
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([])
  const { toast } = useToast()

  const fetchDashboardStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/analytics/metrics', {
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
          title: 'Failed to fetch dashboard stats',
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

  const fetchActiveLoans = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/loans/active', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setActiveLoans(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch active loans',
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

  const fetchPaymentSchedule = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/loans/payment/schedule', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setPaymentSchedule(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch payment schedule',
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

  const fetchRecentTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/payments/recent', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setRecentTransactions(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch recent transactions',
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

  const makePayment = useCallback(async (paymentId: string, amount: number, method: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/loans/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          paymentId,
          amount,
          method,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Payment Successful',
          description: `Payment of KES ${amount} has been processed.`,
        })
        return result.data
      } else {
        toast({
          title: 'Payment Failed',
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
    activeLoans,
    paymentSchedule,
    recentTransactions,
    fetchDashboardStats,
    fetchActiveLoans,
    fetchPaymentSchedule,
    fetchRecentTransactions,
    makePayment,
  }
}