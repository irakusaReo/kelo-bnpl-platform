'use client'

import { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'

interface ReportData {
  id: string
  title: string
  type: string
  status: 'generating' | 'completed' | 'failed'
  createdAt: string
  downloadUrl?: string
}

export function useReports() {
  const [isLoading, setIsLoading] = useState(false)
  const [reports, setReports] = useState<ReportData[]>([])
  const { toast } = useToast()

  const generateReport = useCallback(async (data: any) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/analytics/reports', {
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
          title: 'Report Generation Started',
          description: 'Your report is being generated and will be available soon.',
        })
        return result.data
      } else {
        toast({
          title: 'Report Generation Failed',
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

  const fetchReports = useCallback(async (filters?: any) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, String(value))
        })
      }

      const response = await fetch(`/api/analytics/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setReports(result.data)
        return result.data
      } else {
        toast({
          title: 'Failed to fetch reports',
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

  const downloadReport = useCallback(async (reportId: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics/reports/${reportId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${reportId}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        toast({
          title: 'Report Downloaded',
          description: 'Your report has been downloaded successfully.',
        })
        return true
      } else {
        toast({
          title: 'Download Failed',
          description: 'Failed to download the report. Please try again.',
          variant: 'destructive',
        })
        return false
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  return {
    reports,
    isLoading,
    generateReport,
    fetchReports,
    downloadReport,
  }
}
