import { createClient } from '@/lib/supabase/server'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  is_approved: boolean
  avatar?: string | null
  created_at?: string
}

export async function getSessionUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, email, name, role, is_approved, avatar, created_at')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as UserProfile
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getSessionUser()
  if (!user) return null
  return getUserProfile(user.id)
}

export function isAdmin(profile: UserProfile | null): boolean {
  return profile?.role === 'ADMIN'
}
