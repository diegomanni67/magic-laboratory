import { createClient } from '@supabase/supabase-js'
import { getSupabaseServiceRoleKey, getSupabaseUrl } from './env'

export function createAdminClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseServiceRoleKey()

  if (!url || !key) {
    console.error('[supabase] Admin client skipped because env vars are missing', {
      hasUrl: Boolean(url),
      hasServiceRoleKey: Boolean(key),
      urlPreview: url ? url.slice(0, 40) : '(missing)',
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    })
  }

  return createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key', {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
