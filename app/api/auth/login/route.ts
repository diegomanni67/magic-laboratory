import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users')
      .select('is_approved, role')
      .eq('id', data.user.id)
      .single()

    return NextResponse.json({
      success: true,
      is_approved: profile?.is_approved ?? false,
      role: profile?.role ?? 'APPRENTICE',
    })
  } catch {
    return NextResponse.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}
