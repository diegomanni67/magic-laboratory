import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Obtener comentarios de un producto específico
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")

  if (!productId) {
    return NextResponse.json({ error: "Falta el ID del producto" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("marketplace_comments")
    .select("id, content, created_at, user_id, users:user_id (name, artistic_name)")
    .eq("product_id", productId)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments: data })
}

// Publicar un nuevo comentario
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { product_id, content } = await request.json()

  if (!product_id || !content.trim()) {
    return NextResponse.json({ error: "Datos insuficientes" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("marketplace_comments")
    .insert({ product_id, content, user_id: user.id })
    .select("id, content, created_at, user_id, users:user_id (name, artistic_name)")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comment: data })
}