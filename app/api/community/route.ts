import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Usa el server client normal (no admin) porque la policy
// "Public can read basic profile fields" permite SELECT a todos.
// Columnas seguras únicamente — sin email.
export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('users')
    .select('id, name, artistic_name, role, country, city, bio, instagram, youtube, avatar')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message, members: [] }, { status: 500 })
  }

  return NextResponse.json({ members: data ?? [] })
}
