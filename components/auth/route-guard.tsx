"use client"

import { useAuth } from '@/components/auth/AuthProvider'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface RouteGuardProps {
  children: React.ReactNode
  requireApproved?: boolean
  requireAdmin?: boolean
}

export function RouteGuard({ children, requireApproved = true, requireAdmin = false }: RouteGuardProps) {
  const { profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!profile) {
      router.push('/login')
      return
    }

    if (requireAdmin && profile.role !== 'ADMIN') {
      router.push('/')
      return
    }

    if (requireApproved && !profile.is_approved) {
   
    }
  }, [profile, loading, requireApproved, requireAdmin, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    )
  }

  if (!profile) return null
  if (requireAdmin && profile.role !== 'ADMIN') return null
  if (requireApproved && !profile.is_approved) return null

  return <>{children}</>
}
