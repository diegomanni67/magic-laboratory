import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getSupabaseUrl, getSupabaseServiceRoleKey } from '@/lib/supabase/env'

export async function GET() {
  const url = getSupabaseUrl()
  const serviceKey = getSupabaseServiceRoleKey()

  // Si no hay service role key real, lo detectamos por el valor placeholder
  if (!serviceKey || serviceKey === 'placeholder-service-role-key') {
    return NextResponse.json(
      { error: 'SUPABASE_SERVICE_ROLE_KEY no configurada en Vercel', members: [] },
      { status: 500 }
    )
  }

  const admin = createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data, error } = await admin
    .from('users')
    .select('id, name, artistic_name, role, country, city, bio, instagram, youtube, avatar')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[community] Supabase error:', error.message)
    return NextResponse.json({ error: error.message, members: [] }, { status: 500 })
  }

  return NextResponse.json({ members: data ?? [] })
}
