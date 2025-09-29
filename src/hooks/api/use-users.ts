'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  userType: 'customer' | 'merchant' | 'admin'
  createdAt: string
  updatedAt: string
}

interface ProfileData {
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: string
  address?: string
  city?: string
  country?: string
  postalCode?: string
  bio?: string
}

export function useUsers() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<UserData | null>(null)
  const { toast } = useToast()

  const fetchUserProfile = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setUser(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch user profile',
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

  const updateProfile = useCallback(async (data: ProfileData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        setUser(prev => prev ? { ...prev, ...data } : null)
        toast({
          title: 'Profile Updated',
          description: 'Your profile has been updated successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Update Failed',
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

  const getUserSettings = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        return result.data
      } else {
        toast({
          title: 'Failed to fetch user settings',
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

  const updateUserSettings = useCallback(async (settings: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify(settings),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Settings Updated',
          description: 'Your settings have been updated successfully.',
        })
        return result.data
      } else {
        toast({
          title: 'Update Failed',
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

  return {
    user,
    isLoading,
    fetchUserProfile,
    updateProfile,
    getUserSettings,
    updateUserSettings,
  }
}