import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserProfile {
  id: string
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
  avatar?: string
  createdAt: string
  updatedAt: string
}

interface UserState {
  profile: UserProfile | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setProfile: (profile: UserProfile) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  fetchProfile: () => Promise<void>
  updateProfileData: (data: Partial<UserProfile>) => Promise<boolean>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      profile: null,
      isLoading: false,
      error: null,

      setProfile: (profile) => set({ profile, error: null }),
      updateProfile: (updates) => set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      })),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      fetchProfile: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await fetch('/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            },
          })

          const result = await response.json()

          if (result.success) {
            set({ profile: result.data, isLoading: false })
          } else {
            set({
              isLoading: false,
              error: result.message || 'Failed to fetch profile',
            })
          }
        } catch (error) {
          set({
            isLoading: false,
            error: 'An unexpected error occurred',
          })
        }
      },

      updateProfileData: async (data) => {
        set({ isLoading: true, error: null })
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
            set((state) => ({
              profile: state.profile ? { ...state.profile, ...data } : null,
              isLoading: false,
            }))
            return true
          } else {
            set({
              isLoading: false,
              error: result.message || 'Failed to update profile',
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
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        profile: state.profile,
      }),
    }
  )
)