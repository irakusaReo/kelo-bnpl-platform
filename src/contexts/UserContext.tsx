'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { Profile } from '@/types'

type UserContextType = {
  supabase: SupabaseClient | null
  user: User | null
  profile: Profile | null
  accessToken: string | null
  isLoading: boolean
  error: any
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  useEffect(() => {
    const fetchSession = async () => {
      try {
        setIsLoading(true)
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error

        setUser(session?.user ?? null)
        setAccessToken(session?.access_token ?? null)

        if (session?.user) {
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) throw profileError
          setProfile(userProfile)
        }
      } catch (e) {
        setError(e)
        console.error("Error fetching user session:", e)
      } finally {
        setIsLoading(false)
      }
    }

    fetchSession()

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setAccessToken(session?.access_token ?? null)
        setProfile(null)

        if (session?.user) {
          setIsLoading(true)
          const { data: userProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError) {
              setError(profileError)
              console.error("Error fetching profile on auth change:", profileError)
          } else {
            setProfile(userProfile)
          }
          setIsLoading(false)
        }
      }
    )

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase])

  const value = {
    supabase,
    user,
    profile,
    accessToken,
    isLoading,
    error,
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}