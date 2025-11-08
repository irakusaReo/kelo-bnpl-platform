'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import type { DashboardStats, Loan, PaymentSchedule, Transaction } from '@/types/dashboard'
import api from '@/services/api'

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
      const response = await api.get('/analytics/metrics')
      const result = response.data;
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
      return null
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchActiveLoans = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/loans/active')
      const result = response.data;
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
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchPaymentSchedule = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/loans/payment/schedule')
      const result = response.data;
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
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const fetchRecentTransactions = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await api.get('/payments/recent')
      const result = response.data;
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
      return []
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  const makePayment = useCallback(async (paymentId: string, amount: number, method: string) => {
    setIsLoading(true)
    try {
      const response = await api.post('/loans/payment', {
        paymentId,
        amount,
        method,
      })
      const result = response.data;

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
