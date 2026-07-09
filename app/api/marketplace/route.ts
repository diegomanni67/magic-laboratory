import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('marketplace_products')
    .select('id, title, description, type, price, trade_preference, image_url, created_at, user_id, users:user_id (name, country, city)')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ products: data ?? [] })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { id, title, description, type, price, trade_preference, image_url } = body

  if (!id) {
    return NextResponse.json({ error: 'ID del producto requerido' }, { status: 400 })
  }

  // Actualizamos el producto asegurándonos de que pertenezca al usuario logueado (.eq('user_id', user.id))
  const { data, error } = await supabase
    .from('marketplace_products')
    .update({
      title,
      description,
      type,
      price: type === 'venta' ? price ?? null : null,
      trade_preference: type === 'canje' ? trade_preference ?? null : null,
      image_url: image_url || null,
    })
    .eq('id', id)
    .eq('user_id', user.id) 
    .select('id, title, description, type, price, trade_preference, image_url, created_at, user_id, users:user_id (name, country, city)')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product: data })
}

  const body = await request.json().catch(() => ({}))
  const { title, description, type, price, trade_preference, image_url } = body as {
    title?: string
    description?: string
    type?: 'venta' | 'canje'
    price?: number | null
    trade_preference?: string | null
    image_url?: string | null
  }

  const { data, error } = await supabase
    .from('marketplace_products')
    .insert({
      title,
      description,
      type,
      price: type === 'venta' ? price ?? null : null,
      trade_preference: type === 'canje' ? trade_preference ?? null : null,
      image_url: image_url || null,
      user_id: user.id,
    })
    .select('id, title, description, type, price, trade_preference, image_url, created_at, user_id')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ product: data })
}
