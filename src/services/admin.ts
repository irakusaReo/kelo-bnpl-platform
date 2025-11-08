import { fetcher, poster } from './api'
import { Profile } from '@/types/profile'
import { MerchantStore } from '@/types' // Use the more detailed type
import { PlatformAnalytics } from '@/types/analytics'

// Analytics
export const getAnalytics = (): Promise<PlatformAnalytics> =>
  fetcher('/admin/analytics')

// User Management
export const getUsers = (
  page: number,
  pageSize: number,
  search: string
): Promise<Profile[]> =>
  fetcher(`/admin/users?page=${page}&pageSize=${pageSize}&search=${search}`)

export const suspendUser = (userId: string): Promise<void> =>
  poster(`/admin/users/${userId}/suspend`, {})

export const unsuspendUser = (userId: string): Promise<void> =>
  poster(`/admin/users/${userId}/unsuspend`, {})

export const changeUserRole = (
  userId: string,
  role: string
): Promise<void> => poster(`/admin/users/${userId}/role`, { role })

// Merchant Management
export const getMerchants = (
  page: number,
  pageSize: number,
  status: string,
  search: string
): Promise<MerchantStore[]> =>
  fetcher(
    `/admin/merchants?page=${page}&pageSize=${pageSize}&status=${status}&search=${search}`
  )

export const approveMerchant = (merchantId: string): Promise<void> =>
  poster(`/admin/merchants/${merchantId}/approve`, {})

export const suspendMerchant = (merchantId: string): Promise<void> =>
  poster(`/admin/merchants/${merchantId}/suspend`, {})
