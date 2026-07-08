import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET messages for a specific room
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const roomId = searchParams.get('room_id')

  if (!roomId) {
    return NextResponse.json({ error: 'room_id is required' }, { status: 400 })
  }

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select(`
      id,
      message,
      created_at,
      user_id,
      users (
        id,
        name,
        artistic_name
      )
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages })
}

// POST create a new message
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { room_id, message } = body

  if (!room_id || !message) {
    return NextResponse.json({ error: 'room_id y message son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id,
      user_id: user.id,
      message: message.trim()
    })
    .select(`
      id,
      message,
      created_at,
      user_id,
      users (
        id,
        name,
        artistic_name
      )
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: data })
}
