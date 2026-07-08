import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('avatar') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No se recibió ningún archivo' }, { status: 400 })
  }

  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: 'La imagen no puede superar 2MB' }, { status: 400 })
  }

  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Usá JPG, PNG o WebP' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  // La carpeta es el user.id — las policies de storage validan exactamente esto
  const path = `${user.id}/avatar.${ext}`

  const bytes = await file.arrayBuffer()

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true, // sobreescribe si ya existe
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  // Agrega un timestamp para evitar que el browser use la versión cacheada
  const avatarUrl = `${publicUrl}?t=${Date.now()}`

  const { error: updateError } = await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({ avatar_url: avatarUrl })
}
