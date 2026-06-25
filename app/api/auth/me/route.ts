import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ profile: null })
  }

  // Intentamos buscar el perfil, pero si no existe, creamos uno básico al vuelo
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    profile: profile || {
      id: user.id,
      email: user.email,
      name: user.email?.split('@')[0] || 'Usuario',
      role: 'ADMIN',
      is_approved: true
    }
  })
}