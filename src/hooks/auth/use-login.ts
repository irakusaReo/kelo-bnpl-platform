'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface LoginCredentials {
  email: string
  password: string
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
  userType: 'customer' | 'merchant'
}

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const result = await response.json()

      if (result.success) {
        // Store token in localStorage
        localStorage.setItem('auth_token', result.data.token)
        localStorage.setItem('user', JSON.stringify(result.data.user))
        
        toast({
          title: 'Login successful',
          description: 'Welcome back to Kelo!',
        })
        
        // Redirect based on user role
        const userRole = result.data.user.userType
        switch (userRole) {
          case 'customer':
            router.push('/dashboard')
            break
          case 'merchant':
            router.push('/merchant')
            break
          case 'admin':
            router.push('/admin')
            break
          default:
            router.push('/dashboard')
        }
        
        return result.data
      } else {
        toast({
          title: 'Login failed',
          description: result.message || 'Please check your credentials and try again.',
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
  }, [router, toast])

  return { login, isLoading }
}

export function useRegister() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: 'Registration successful',
          description: 'Welcome to Kelo! Please check your email to verify your account.',
        })
        
        // Redirect to login page
        router.push('/auth/login')
        
        return result.data
      } else {
        toast({
          title: 'Registration failed',
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
  }, [router, toast])

  return { register, isLoading }
}

export function useLogout() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      // Clear local storage regardless of API response
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
      if (result.success) {
        toast({
          title: 'Logout successful',
          description: 'You have been logged out successfully.',
        })
      } else {
        toast({
          title: 'Logout completed',
          description: 'You have been logged out.',
        })
      }
      
      // Redirect to login page
      router.push('/auth/login')
      
      return true
    } catch (error) {
      // Clear local storage even if API fails
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
      toast({
        title: 'Logout completed',
        description: 'You have been logged out.',
      })
      
      router.push('/auth/login')
      return true
    } finally {
      setIsLoading(false)
    }
  }, [router, toast])

  return { logout, isLoading }
}