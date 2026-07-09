import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Obtener la conversación con un usuario específico o lista de chats
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const withUserId = searchParams.get("with")

  if (withUserId) {
    // Cargar historial entre estos dos usuarios
    const { data, error } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${withUserId}),and(sender_id.eq.${withUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ messages: data })
  }

  // Si no hay "with", listar los hilos de conversación activos del usuario actual
  const { data, error } = await supabase
    .from("direct_messages")
    .select("sender_id, receiver_id, content, created_at")
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ initialLogs: data })
}

// Enviar un mensaje
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { receiver_id, content } = await request.json()

  const { data, error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: user.id, receiver_id, content })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: data })
}