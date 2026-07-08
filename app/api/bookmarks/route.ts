import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST/DELETE toggle bookmark
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { challenge_id } = body

  if (!challenge_id) {
    return NextResponse.json({ error: 'challenge_id es requerido' }, { status: 400 })
  }

  // Check if bookmark already exists
  const { data: existingBookmark } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .eq('challenge_id', challenge_id)
    .single()

  if (existingBookmark) {
    // Remove bookmark
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', existingBookmark.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookmarked: false })
  } else {
    // Add bookmark
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({
        user_id: user.id,
        challenge_id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ bookmarked: true, bookmark: data })
  }
}

// GET check if user has bookmarked a challenge
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ bookmarked: false })
  }

  const { searchParams } = new URL(request.url)
  const challengeId = searchParams.get('challenge_id')

  if (!challengeId) {
    return NextResponse.json({ error: 'challenge_id is required' }, { status: 400 })
  }

  const { data: bookmark } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .eq('challenge_id', challengeId)
    .single()

  return NextResponse.json({ bookmarked: !!bookmark })
}
