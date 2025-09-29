'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface PaymentData {
  amount: string
  paymentMethod: string
  loanId: string
  phoneNumber?: string
  accountNumber?: string
  bankName?: string
  walletAddress?: string
}

export function usePaymentForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const makePayment = useCallback(async (data: PaymentData) => {
    setIsLoading(true)
    try {
      let endpoint = '/api/payments/'
      
      switch (data.paymentMethod) {
        case 'mpesa':
          endpoint += 'mpesa'
          break
        case 'bank-transfer':
          endpoint += 'bank-transfer'
          break
        case 'crypto':
          endpoint += 'crypto'
          break
        case 'wallet':
          endpoint += 'wallet'
          break
        default:
          throw new Error('Invalid payment method')
      }

      const response = await fetch(endpoint, {
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
          title: 'Payment Initiated',
          description: 'Your payment has been initiated successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Payment Failed',
          description: result.message || 'Please check your information and try again.',
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

  return { makePayment, isLoading }
}