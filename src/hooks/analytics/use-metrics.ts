'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface MetricsData {
  totalUsers: number
  activeLoans: number
  totalRevenue: number
  averageLoanAmount: number
  repaymentRate: number
  defaultRate: number
}

export function useMetrics() {
  const [isLoading, setIsLoading] = useState(false)
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const { toast } = useToast()

  const fetchMetrics = useCallback(async (filters?: any) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value)
        })
      }

      const response = await fetch(`/api/analytics/metrics?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setMetrics(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch metrics',
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
    metrics,
    isLoading,
    fetchMetrics,
  }
}