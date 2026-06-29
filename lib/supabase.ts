import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './supabase/env'

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

let supabaseClient: ReturnType<typeof createClient> | null = null

try {
  supabaseClient = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key')
} catch (error) {
  console.error('[supabase] Shared client initialization failed', {
    error,
    hasUrl: Boolean(supabaseUrl),
    hasAnonKey: Boolean(supabaseAnonKey),
    nodeEnv: process.env.NODE_ENV,
    vercel: Boolean(process.env.VERCEL),
  })
}

export const supabase = supabaseClient ?? ({} as ReturnType<typeof createClient>)