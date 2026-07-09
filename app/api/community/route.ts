import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, name, artistic_name, role, country, city, bio, instagram, youtube, avatar_url')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, members: [] }, { status: 500 })
  }

  return NextResponse.json({ members: data ?? [] })
}
