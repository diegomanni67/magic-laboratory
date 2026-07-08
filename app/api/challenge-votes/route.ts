import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST create a vote (or delete if already voted)
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  const body = await request.json()
  const { submission_id } = body

  if (!submission_id) {
    return NextResponse.json({ error: 'submission_id es requerido' }, { status: 400 })
  }

  // Check if user already voted for this submission
  const { data: existingVote } = await supabase
    .from('challenge_votes')
    .select('*')
    .eq('submission_id', submission_id)
    .eq('user_id', user.id)
    .single()

  if (existingVote) {
    // Remove the vote (toggle off)
    const { error } = await supabase
      .from('challenge_votes')
      .delete()
      .eq('id', existingVote.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ voted: false })
  } else {
    // Add the vote (toggle on)
    const { data, error } = await supabase
      .from('challenge_votes')
      .insert({
        submission_id,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ voted: true, vote: data })
  }
}

// GET check if user voted for a submission
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ voted: false })
  }

  const { searchParams } = new URL(request.url)
  const submissionId = searchParams.get('submission_id')

  if (!submissionId) {
    return NextResponse.json({ error: 'submission_id is required' }, { status: 400 })
  }

  const { data: vote } = await supabase
    .from('challenge_votes')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ voted: !!vote })
}
