'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    borderWidth?: number
  }>
}

export function useCharts() {
  const [isLoading, setIsLoading] = useState(false)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const { toast } = useToast()

  const fetchChartData = useCallback(async (chartType: string, filters?: any) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('type', chartType)
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value))
        })
      }

      const response = await fetch(`/api/analytics/charts?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setChartData(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch chart data',
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
    chartData,
    isLoading,
    fetchChartData,
  }
}
