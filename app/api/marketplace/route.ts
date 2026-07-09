import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Obtener todas las publicaciones
export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("marketplace_products")
    .select("id, title, description, type, price, trade_preference, image_url, created_at, user_id, users:user_id (name, country, city, artistic_name)")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ products: data })
}

// Publicar un producto nuevo
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { title, description, type, price, trade_preference, image_url } = body

  const { data, error } = await supabase
    .from("marketplace_products")
    .insert({
      title,
      description,
      type,
      price: type === "venta" ? price : null,
      trade_preference: type === "canje" ? trade_preference : null,
      image_url,
      user_id: user.id
    })
    .select("id, title, description, type, price, trade_preference, image_url, created_at, user_id, users:user_id (name, country, city, artistic_name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}

// Editar publicación existente
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { id, title, description, type, price, trade_preference, image_url } = body

  if (!id) return NextResponse.json({ error: 'ID del producto requerido' }, { status: 400 })

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
    .select('id, title, description, type, price, trade_preference, image_url, created_at, user_id, users:user_id (name, country, city, artistic_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ product: data })
}