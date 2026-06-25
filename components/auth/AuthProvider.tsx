"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile } from '@/lib/auth'

interface AuthContextType {
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  profile: null,
  loading: true,
  refreshProfile: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshProfile = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      setProfile(data.profile ?? null)
    } catch {
      setProfile(null)
    }
  }

  const signOut = async () => {
    await fetch('/api/auth/signout', { method: 'POST' })
    setProfile(null)
    window.location.href = '/login'
  }

  useEffect(() => {
    refreshProfile().finally(() => setLoading(false))

    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshProfile()
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ profile, loading, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
