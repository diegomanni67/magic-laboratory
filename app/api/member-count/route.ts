import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const adminClient = createAdminClient()
    const { count, error } = await adminClient.from('users').select('*', { count: 'exact', head: true })

    if (error) {
      console.error('[member-count] failed', error)
      return NextResponse.json({ count: 0, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ count: count ?? 0 })
  } catch (error) {
    console.error('[member-count] unexpected error', error)
    return NextResponse.json({ count: 0, error: 'No se pudo calcular el contador' }, { status: 500 })
  }
}
