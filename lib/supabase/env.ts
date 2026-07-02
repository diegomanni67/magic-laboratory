const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key'
const FALLBACK_SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key'

function logSupabaseEnvIssue(message: string, details: Record<string, unknown>) {
  console.error(`[supabase] ${message}`, details)
}

const PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/^['"]|['"]$/g, '')
const PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim().replace(/^['"]|['"]$/g, '')

const SERVER_SUPABASE_URL = process.env.SUPABASE_URL?.trim().replace(/^['"]|['"]$/g, '')
const SERVER_SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY?.trim().replace(/^['"]|['"]$/g, '')
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/^['"]|['"]$/g, '')

function isValidSupabaseUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function getSupabaseUrl() {
  const value = PUBLIC_SUPABASE_URL || SERVER_SUPABASE_URL

  if (value) {
    if (isValidSupabaseUrl(value)) {
      return value
    }

    logSupabaseEnvIssue('Invalid Supabase URL detected', {
      receivedValue: value,
      nodeEnv: process.env.NODE_ENV,
    })
  } else {
    logSupabaseEnvIssue('Missing Supabase URL environment variable', {
      nodeEnv: process.env.NODE_ENV,
    })
  }

  return FALLBACK_SUPABASE_URL
}

export function getSupabaseAnonKey() {
  const value = PUBLIC_SUPABASE_ANON_KEY || SERVER_SUPABASE_ANON_KEY

  if (value) {
    return value
  }

  logSupabaseEnvIssue('Missing Supabase anon key environment variable', {
    nodeEnv: process.env.NODE_ENV,
  })

  return FALLBACK_SUPABASE_ANON_KEY
}

export function getSupabaseServiceRoleKey() {
  if (SERVICE_ROLE_KEY) {
    return SERVICE_ROLE_KEY
  }

  logSupabaseEnvIssue('Missing Supabase service role key environment variable', {
    nodeEnv: process.env.NODE_ENV,
  })

  return FALLBACK_SUPABASE_SERVICE_ROLE_KEY
}