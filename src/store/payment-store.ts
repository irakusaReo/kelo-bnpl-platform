import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Payment {
  id: string
  amount: number
  method: 'mpesa' | 'bank-transfer' | 'crypto' | 'wallet'
  status: 'pending' | 'completed' | 'failed'
  loanId: string
  transactionId?: string
  createdAt: string
  updatedAt: string
  processedAt?: string
  failureReason?: string
}

interface Wallet {
  id: string
  balance: number
  currency: string
  createdAt: string
  updatedAt: string
}

interface PaymentState {
  payments: Payment[]
  wallet: Wallet | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setPayments: (payments: Payment[]) => void
  setWallet: (wallet: Wallet) => void
  addPayment: (payment: Payment) => void
  updatePayment: (id: string, updates: Partial<Payment>) => void
  updateWalletBalance: (amount: number) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchPayments: (filters?: any) => Promise<void>
  fetchWallet: () => Promise<void>
  makePayment: (data: any) => Promise<boolean>
  getWalletBalance: () => Promise<number>
}

export const usePaymentStore = create<PaymentState>()(
  (set, get) => ({
    payments: [],
    wallet: null,
    isLoading: false,
    error: null,

    setPayments: (payments) => set({ payments, error: null }),
    setWallet: (wallet) => set({ wallet, error: null }),
    addPayment: (payment) => set((state) => ({ payments: [...state.payments, payment] })),
    updatePayment: (id, updates) => set((state) => ({
      payments: state.payments.map(payment => payment.id === id ? { ...payment, ...updates } : payment),
    })),
    updateWalletBalance: (amount) => set((state) => ({
      wallet: state.wallet ? { ...state.wallet, balance: state.wallet.balance + amount } : null,
    })),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    fetchPayments: async (filters) => {
      set({ isLoading: true, error: null })
      try {
        const params = new URLSearchParams()
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value)
          })
        }

        const response = await fetch(`/api/payments?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set({ payments: result.data, isLoading: false })
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to fetch payments',
          })
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
      }
    },

    fetchWallet: async () => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/payments/wallet', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set({ wallet: result.data, isLoading: false })
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to fetch wallet',
          })
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
      }
    },

    makePayment: async (data) => {
      set({ isLoading: true, error: null })
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
          set((state) => ({
            payments: [...state.payments, result.data],
            isLoading: false,
          }))
          return true
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to make payment',
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

    getWalletBalance: async () => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/payments/wallet', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set({ wallet: result.data, isLoading: false })
          return result.data.balance
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to get wallet balance',
          })
          return 0
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
        return 0
      }
    },
  })
)