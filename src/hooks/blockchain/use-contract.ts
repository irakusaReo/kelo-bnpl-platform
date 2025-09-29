'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ContractData {
  address: string
  name: string
  network: string
  type: string
  status: 'active' | 'inactive' | 'deprecated'
}

export function useContract() {
  const [isLoading, setIsLoading] = useState(false)
  const [contract, setContract] = useState<ContractData | null>(null)
  const { toast } = useToast()

  const getContractInfo = useCallback(async (contractAddress: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/blockchain/contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({ address: contractAddress }),
      })

      const result = await response.json()

      if (result.success) {
        setContract(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch contract info',
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

  const interactWithContract = useCallback(async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/blockchain/contract', {
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
          title: 'Contract Interaction Successful',
          description: 'Your contract interaction has been completed successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Contract Interaction Failed',
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
    contract,
    isLoading,
    getContractInfo,
    interactWithContract,
  }
}