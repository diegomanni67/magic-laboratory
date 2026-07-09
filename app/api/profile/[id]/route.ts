import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Usa server client normal — la policy "Public can read basic profile fields"
// permite SELECT a todos. Columnas seguras únicamente, sin email.
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

  const supabase = await createClient()

  const { data: profile, error: profileError } = await supabase
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

  const { data: products } = await supabase
    .from('marketplace_products')
    .select('id, title, description, type, price, trade_preference, image_url, created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ profile, products: products ?? [] })
}
