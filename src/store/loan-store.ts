import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Loan {
  id: string
  amount: number
  purpose: string
  duration: number
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'completed' | 'defaulted'
  interestRate: number
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  createdAt: string
  updatedAt: string
  userId: string
  userType: 'customer' | 'merchant'
  approvedAt?: string
  completedAt?: string
}

interface LoanApplication {
  id: string
  amount: number
  purpose: string
  duration: number
  income: number
  employmentStatus: string
  businessName?: string
  businessType?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
  userId: string
  userType: 'customer' | 'merchant'
}

interface LoanState {
  loans: Loan[]
  applications: LoanApplication[]
  activeLoans: Loan[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setLoans: (loans: Loan[]) => void
  setApplications: (applications: LoanApplication[]) => void
  setActiveLoans: (loans: Loan[]) => void
  addLoan: (loan: Loan) => void
  addApplication: (application: LoanApplication) => void
  updateLoan: (id: string, updates: Partial<Loan>) => void
  updateApplication: (id: string, updates: Partial<LoanApplication>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchLoans: (filters?: any) => Promise<void>
  fetchApplications: (filters?: any) => Promise<void>
  fetchActiveLoans: () => Promise<void>
  submitApplication: (data: any) => Promise<boolean>
}

export const useLoanStore = create<LoanState>()(
  (set, get) => ({
    loans: [],
    applications: [],
    activeLoans: [],
    isLoading: false,
    error: null,

    setLoans: (loans) => set({ loans, error: null }),
    setApplications: (applications) => set({ applications, error: null }),
    setActiveLoans: (loans) => set({ activeLoans: loans, error: null }),
    addLoan: (loan) => set((state) => ({ loans: [...state.loans, loan] })),
    addApplication: (application) => set((state) => ({ applications: [...state.applications, application] })),
    updateLoan: (id, updates) => set((state) => ({
      loans: state.loans.map(loan => loan.id === id ? { ...loan, ...updates } : loan),
      activeLoans: state.activeLoans.map(loan => loan.id === id ? { ...loan, ...updates } : loan),
    })),
    updateApplication: (id, updates) => set((state) => ({
      applications: state.applications.map(app => app.id === id ? { ...app, ...updates } : app),
    })),
    setLoading: (loading) => set({ isLoading: loading }),
    setError: (error) => set({ error }),

    fetchLoans: async (filters) => {
      set({ isLoading: true, error: null })
      try {
        const params = new URLSearchParams()
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })
        }

        const response = await fetch(`/api/loans/applications?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set({ loans: result.data, isLoading: false })
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to fetch loans',
          })
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
      }
    },

    fetchApplications: async (filters) => {
      set({ isLoading: true, error: null })
      try {
        const params = new URLSearchParams()
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })
        }

        const response = await fetch(`/api/loans/applications?${params}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set({ applications: result.data, isLoading: false })
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to fetch applications',
          })
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
      }
    },

    fetchActiveLoans: async () => {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/loans/active', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })

        const result = await response.json()

        if (result.success) {
          set({ activeLoans: result.data, isLoading: false })
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to fetch active loans',
          })
        }
      } catch (error) {
        set({
          isLoading: false,
          error: 'An unexpected error occurred',
        })
      }
    },

    submitApplication: async (data) => {
      set({ isLoading: true, error: null })
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
          set((state) => ({
            applications: [...state.applications, result.data],
            isLoading: false,
          }))
          return true
        } else {
          set({
            isLoading: false,
            error: result.message || 'Failed to submit application',
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
