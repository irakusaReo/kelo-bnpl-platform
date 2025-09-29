'use client'

import { useState, useCallback, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface Theme {
  mode: 'light' | 'dark' | 'system'
  primaryColor: string
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>({
    mode: 'system',
    primaryColor: 'hsl(222.2, 84%, 4.9%)',
  })
  const { toast } = useToast()

  useEffect(() => {
    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
      try {
        const parsedTheme = JSON.parse(savedTheme)
        setThemeState(parsedTheme)
      } catch (error) {
        console.error('Failed to parse theme from localStorage:', error)
      }
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    
    if (theme.mode === 'dark') {
      root.classList.add('dark')
    } else if (theme.mode === 'light') {
      root.classList.remove('dark')
    } else {
      // System preference
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      if (systemPrefersDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    }

    // Apply primary color
    root.style.setProperty('--primary', theme.primaryColor)

    // Save theme to localStorage
    localStorage.setItem('theme', JSON.stringify(theme))
  }, [theme])

  const setTheme = useCallback((newTheme: Partial<Theme>) => {
    setThemeState(prev => ({
      ...prev,
      ...newTheme,
    }))
    
    toast({
      title: 'Theme Updated',
      description: 'Your theme preferences have been saved.',
    })
  }, [toast])

  const toggleTheme = useCallback(() => {
    setThemeState(prev => ({
      ...prev,
      mode: prev.mode === 'light' ? 'dark' : prev.mode === 'dark' ? 'system' : 'light',
    }))
  }, [])

  return {
    theme,
    setTheme,
    toggleTheme,
  }
}