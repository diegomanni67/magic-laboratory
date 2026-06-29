import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, contraseña y nombre son obligatorios' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (data.user) {
      try {
        const admin = createAdminClient()
        await admin.from('users').upsert(
          {
            id: data.user.id,
            email,
            name,
            is_approved: false,
            role: 'APPRENTICE',
          },
          { onConflict: 'id' }
        )
      } catch {
        // Profile may be created by DB trigger
      }
    }

    return NextResponse.json({
      success: true,
      message: 'PRUEBA DIEGO 123456',
    })
  } catch {
    return NextResponse.json({ error: 'Error al registrar usuario' }, { status: 500 })
  }
}
