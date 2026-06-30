import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Pequeños límites de cordura para no guardar basura/strings gigantes
const MAX_TEXT = 160
const MAX_BIO = 1000

function clean(value: unknown, max: number) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, max)
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const {
    country,
    city,
    artistic_name,
    bio,
    instagram,
    youtube,
    phone,
  } = body as {
    country?: string
    city?: string
    artistic_name?: string
    bio?: string
    instagram?: string
    youtube?: string
    phone?: string
  }

  // Solo actualizamos los campos que vinieron en el body, para no pisar
  // datos existentes (ej. si el form de ubicación llama a este mismo endpoint).
  const updatePayload: Record<string, string | null> = {}
  if (country !== undefined) updatePayload.country = clean(country, MAX_TEXT)
  if (city !== undefined) updatePayload.city = clean(city, MAX_TEXT)
  if (artistic_name !== undefined) updatePayload.artistic_name = clean(artistic_name, MAX_TEXT)
  if (bio !== undefined) updatePayload.bio = clean(bio, MAX_BIO)
  if (instagram !== undefined) updatePayload.instagram = clean(instagram, MAX_TEXT)
  if (youtube !== undefined) updatePayload.youtube = clean(youtube, MAX_TEXT)
  if (phone !== undefined) updatePayload.phone = clean(phone, MAX_TEXT)

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  // RLS ("Users can update own profile") ya garantiza auth.uid() = id,
  // el .eq('id', user.id) es una segunda barrera explícita en el código.
  const { data, error } = await supabase
    .from('users')
    .update(updatePayload)
    .eq('id', user.id)
    .select('id, email, name, role, country, city, artistic_name, bio, instagram, youtube, phone')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data })
}
