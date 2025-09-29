import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Merchant {
  id: string
  businessName: string
  businessType: string
  email: string
  phone: string
  address: string
  city: string
  country: string
  postalCode: string
  status: 'pending' | 'approved' | 'rejected' | 'suspended'
  registrationNumber: string
  taxId: string
  website?: string
  description?: string
  logo?: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  rejectedAt?: string
  rejectionReason?: string
}

interface MerchantStats {
  totalCustomers: number
  activeLoans: number
  totalRevenue: number
  averageLoanAmount: number
  repaymentRate: number
  monthlyGrowth: number
}

interface MerchantState {
  merchants: Merchant[]
  currentMerchant: Merchant | null
  stats: MerchantStats | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setMerchants: (merchants: Merchant[]) => void
  setCurrentMerchant: (merchant: Merchant) => void
  setStats: (stats: MerchantStats) => void
  addMerchant: (merchant: Merchant) => void
  updateMerchant: (id: string, updates: Partial<Merchant>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchMerchants: (filters?: any) => Promise<void>
  fetchMerchantStats: () => Promise<void>
  approveMerchant: (id: string) => Promise<boolean>
  rejectMerchant: (id: string, reason: string) => Promise<boolean>
  suspendMerchant: (id: string) => Promise<boolean>
  activateMerchant: (id: string) => Promise<boolean>
}

export const useMerchantStore = create<MerchantState>()(
  (set, get) => ({
    merchants: [],
    currentMerchant: null,
    stats: null,
    isLoading: false,
    error: null,

    setMerchants: (merchants) => set({ merchants, error: null }),
    setCurrentMerchant: (merchant) => set({ currentMerchant: merchant, error: null }),
    setStats: (stats) => set({ stats, error: null }),
    addMerchant: (merchant) => set((state) => ({ merchants: [...state.merchants, merchant] })),
    updateMerchant: (id, updates) => set((state) => ({
      merchants: state.merchants.map(merchant => merchant.id === id ? { ...merchant, ...updates } : merchant),
      currentMerchant: state.currentMerchant?.id === id ? { ...state.currentMerchant, ...updates } : state.currentMerchant,
    })),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    fetchMerchants: async (filters) => {
      set({ isLoading: true, error: null })
      try {
        const params = new URLSearchParams()
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value)
          })
        }

        const response = await fetch(`/api/merchants?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set({ merchants: result.data, isLoading: false })
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to fetch merchants',
          })
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
      }
    },

    fetchMerchantStats: async () => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/merchants/stats', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set({ stats: result.data, isLoading: false })
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to fetch merchant stats',
          })
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
      }
    },

    approveMerchant: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/merchants/${id}/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set((state) => ({
            merchants: state.merchants.map(merchant => 
              merchant.id === id ? { ...merchant, status: 'approved' as const } : merchant
            ),
            isLoading: false,
          }))
          return true
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to approve merchant',
          })
          return false
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
        return false
      }
    },

    rejectMerchant: async (id, reason) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/merchants/${id}/reject`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: JSON.stringify({ reason }),
        })

        const result = await response.json()

        if (result.success) {
          set((state) => ({
            merchants: state.merchants.map(merchant => 
              merchant.id === id ? { ...merchant, status: 'rejected' as const, rejectionReason: reason } : merchant
            ),
            isLoading: false,
          }))
          return true
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to reject merchant',
          })
          return false
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
        return false
      }
    },

    suspendMerchant: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/merchants/${id}/suspend`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set((state) => ({
            merchants: state.merchants.map(merchant => 
              merchant.id === id ? { ...merchant, status: 'suspended' as const } : merchant
            ),
            isLoading: false,
          }))
          return true
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to suspend merchant',
          })
          return false
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
        return false
      }
    },

    activateMerchant: async (id) => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch(`/api/merchants/${id}/activate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set((state) => ({
            merchants: state.merchants.map(merchant => 
              merchant.id === id ? { ...merchant, status: 'approved' as const } : merchant
            ),
            isLoading: false,
          }))
          return true
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to activate merchant',
          })
          return false
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
        return false
      }
    },
  })
)