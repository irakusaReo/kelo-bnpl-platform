'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface MerchantData {
  id: string
  businessName: string
  businessType: string
  email: string
  phone: string
  address: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  createdAt: string
  updatedAt: string
}

export function useMerchant() {
  const [isLoading, setIsLoading] = useState(false)
  const [merchants, setMerchants] = useState<MerchantData[]>([])
  const { toast } = useToast()

  const fetchMerchants = useCallback(async (filters?: any) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value))
        })
      }

      const response = await fetch(`/api/merchants?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setMerchants(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch merchants',
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

  const getMerchantStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/merchants/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        toast({
          title: 'Failed to fetch merchant statistics',
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
    merchants,
    isLoading,
    fetchMerchants,
    getMerchantStats,
  }
}
