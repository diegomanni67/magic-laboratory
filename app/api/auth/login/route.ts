import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Usa el server client de @supabase/ssr que sí setea las cookies de sesión
// en la respuesta. Sin esto, el browser nunca recibe el token y el
// AuthProvider siempre muestra "no hay sesión".
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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('[login] signInWithPassword failed', { message: error.message })
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Las cookies de sesión las setea automáticamente el server client de @supabase/ssr
    return NextResponse.json({
      success: true,
      user: data.user,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    console.error('[login] failed', { message })
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
