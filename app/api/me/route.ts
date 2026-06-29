import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ profile: null })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, name, role, is_approved, country, city')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ profile: profile ?? null })
}
