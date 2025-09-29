'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface LoanFilters {
  status?: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted'
  type?: 'customer' | 'merchant'
  dateFrom?: string
  dateTo?: string
}

interface LoanData {
  id: string
  amount: number
  purpose: string
  duration: number
  status: string
  createdAt: string
  updatedAt: string
  userId: string
  userType: 'customer' | 'merchant'
}

export function useLoans() {
  const [isLoading, setIsLoading] = useState(false)
  const [loans, setLoans] = useState<LoanData[]>([])
  const { toast } = useToast()

  const fetchLoans = useCallback(async (filters?: LoanFilters) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })
      }

      const response = await fetch(`/api/loans/applications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setLoans(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch loans',
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

  const fetchLoanHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/loans/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        toast({
          title: 'Failed to fetch loan history',
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
    loans,
    isLoading,
    fetchLoans,
    fetchActiveLoans,
    fetchLoanHistory,
  }
}