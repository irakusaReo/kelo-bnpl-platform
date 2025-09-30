import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { toast } from '@/hooks/use-toast'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response.data,
  (error: AxiosError) => {
    const message = (error.response?.data as any)?.message || error.message
    toast({
      title: 'API Error',
      description: message,
      variant: 'destructive',
    })
    return Promise.reject(error)
  }
)

export const fetcher = <T>(url: string, config?: AxiosRequestConfig): Promise<T> =>
  api.get<T, T>(url, config)

export const poster = <T>(
  url: string,
  data: any,
  config?: AxiosRequestConfig
): Promise<T> => api.post<T, T>(url, data, config)

export default api