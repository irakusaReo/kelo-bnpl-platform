'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface NetworkData {
  name: string
  chainId: number
  symbol: string
  status: 'online' | 'offline' | 'maintenance'
  blockNumber: number
  gasPrice: number
}

export function useNetwork() {
  const [isLoading, setIsLoading] = useState(false)
  const [network, setNetwork] = useState<NetworkData | null>(null)
  const { toast } = useToast()

  const getNetworkStatus = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/blockchain/network', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setNetwork(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch network status',
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

  const switchNetwork = useCallback(async (networkName: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/blockchain/network', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ network: networkName }),
      })

      const result = await response.json()

      if (result.success) {
        setNetwork(result.data)
        toast({
          title: 'Network Switched',
          description: `Successfully switched to ${networkName} network.`,
        })
        return result.data
      } else {
        toast({
          title: 'Network Switch Failed',
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
    network,
    isLoading,
    getNetworkStatus,
    switchNetwork,
  }
}