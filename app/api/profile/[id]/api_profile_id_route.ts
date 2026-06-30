import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Ruta pública: cualquiera puede ver el perfil artístico de un usuario.
// Por seguridad usamos el cliente admin (service role) SOLO en el servidor
// y seleccionamos explícitamente una lista blanca de columnas seguras.
// El email y cualquier otro dato sensible NUNCA se incluyen en el select,
// así que jamás pueden filtrarse por accidente al cliente.
const PUBLIC_FIELDS =
  'id, name, artistic_name, role, country, city, bio, instagram, youtube, phone, avatar, is_approved'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { id } = await params

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: profile, error: profileError } = await admin
    .from('users')
    .select(PUBLIC_FIELDS)
    .eq('id', id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ error: 'Perfil no encontrado' }, { status: 404 })
  }

  // Productos publicados por este usuario en el marketplace (tabla pública)
  const { data: products } = await admin
    .from('marketplace_products')
    .select('id, title, description, type, price, trade_preference, image_url, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ profile, products: products ?? [] })
}
