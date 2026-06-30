import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from '@/lib/supabase/env'

// En Route Handlers el cliente de @supabase/ssr necesita operar
// sobre un NextResponse explícito para poder setear las cookies.
// Si usamos createClient() de lib/supabase/server las cookies
// se intentan setear via cookieStore pero el Route Handler las ignora.
export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      )
    }

    // Creamos la respuesta primero para poder pasarle las cookies
    const response = NextResponse.json({ success: true })

    const supabase = createServerClient(
      getSupabaseUrl(),
      getSupabaseAnonKey(),
      {
        cookies: {
          getAll() {
            return request.headers.get('cookie')
              ? request.headers.get('cookie')!.split(';').map((c) => {
                  const [name, ...rest] = c.trim().split('=')
                  return { name, value: rest.join('=') }
                })
              : []
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    // Las cookies de sesión ya fueron seteadas en response via setAll
    return response

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
