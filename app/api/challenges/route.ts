import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  // Get the active challenge (the one with the furthest end_date in the future)
  const { data: challenge, error } = await supabase
    .from('challenges')
    .select('*')
    .gte('end_date', new Date().toISOString())
    .order('end_date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ challenge })
}
