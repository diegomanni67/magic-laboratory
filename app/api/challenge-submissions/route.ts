import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET all submissions for a challenge (with user info and vote counts)
export async function GET(request: Request) {
  const supabase = await createClient()
  const { searchParams } = new URL(request.url)
  const challengeId = searchParams.get('challenge_id')

  if (!challengeId) {
    return NextResponse.json({ error: 'challenge_id is required' }, { status: 400 })
  }

  const { data: submissions, error } = await supabase
    .from('challenge_submissions')
    .select(`
      id,
      video_url,
      created_at,
      user_id,
      users (
        id,
        name,
        artistic_name
      ),
      challenge_votes (count)
    `)
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submissions })
}

// POST create a new submission
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { challenge_id, video_url } = body

  if (!challenge_id || !video_url) {
    return NextResponse.json({ error: 'challenge_id y video_url son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('challenge_submissions')
    .insert({
      challenge_id,
      user_id: user.id,
      video_url
    })
    .select()
    .single()

  if (error) {
    // Handle unique constraint violation
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Ya te has postulado a este desafío' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ submission: data })
}
