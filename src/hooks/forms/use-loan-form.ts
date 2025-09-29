'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface LoanApplicationData {
  amount: string
  purpose: string
  duration: string
  income: string
  employmentStatus: string
  businessName?: string
  businessType?: string
  type: 'customer' | 'merchant'
}

export function useLoanForm() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const submitApplication = useCallback(async (data: LoanApplicationData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/loans/applications', {
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
          title: 'Application Submitted',
          description: 'Your loan application has been submitted successfully. We will review it and get back to you soon.',
        })
        return result.data
      } else {
        toast({
          title: 'Application Failed',
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

  return { submitApplication, isLoading }
}