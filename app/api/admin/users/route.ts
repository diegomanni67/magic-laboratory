import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'No autenticado' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }) }
  }

  return { user }
}

export async function GET() {
  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .select('id, email, name, role, is_approved, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ users: data })
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

  const { userId, is_approved } = await request.json()

  if (!userId || typeof is_approved !== 'boolean') {
    return NextResponse.json(
      { error: 'userId e is_approved son obligatorios' },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('users')
    .update({ is_approved, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select('id, email, name, role, is_approved')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ user: data })
}
