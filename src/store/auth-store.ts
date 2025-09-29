import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  userType: 'customer' | 'merchant' | 'admin'
  createdAt: string
  updatedAt: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  login: (credentials: { email: string; password: string }) => Promise<boolean>
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: true, error: null }),
      setToken: (token) => set({ token }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false, error: null }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      login: async (credentials) => {
        set({ isLoading: true, error: null })
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
            set({
              user: result.data.user,
              token: result.data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            })
            return true
          } else {
            set({
              isLoading: false,
              error: result.message || 'Login failed',
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

      logout: () => {
        // Call logout API if needed
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${get().token}`,
          },
        }).catch(() => {
          // Ignore errors during logout
        })
        
        get().clearAuth()
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)