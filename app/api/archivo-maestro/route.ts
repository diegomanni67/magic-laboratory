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

export async function POST(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

  const { title, description, category, link_url, added_by } = await request.json()

  if (!title?.trim() || !description?.trim()) {
    return NextResponse.json({ error: 'Título y descripción son obligatorios' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('master_archive')
    .insert({
      title: title.trim(),
      description: description.trim(),
      category: category || 'otro',
      link_url: link_url?.trim() || null,
      added_by: added_by || 'Admin',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ item: data })
}

export async function DELETE(request: Request) {
  const auth = await requireAdmin()
  if ('error' in auth && auth.error) return auth.error

  const { id } = await request.json()
  if (!id) {
    return NextResponse.json({ error: 'id es obligatorio' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin.from('master_archive').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
