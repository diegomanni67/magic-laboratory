import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Lista pública de miembros aprobados.
// Admin client porque la RLS de users solo permite leer el propio registro.
// Lista blanca de columnas: nunca se expone email.
export async function GET() {
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('users')
    .select('id, name, artistic_name, role, country, city, bio, instagram, youtube, avatar')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ members: data ?? [] })
}
