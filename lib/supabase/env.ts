const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'placeholder-anon-key'
const FALLBACK_SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key'

function logSupabaseEnvIssue(message: string, details: Record<string, unknown>) {
  console.error(`[supabase] ${message}`, details)
}

function readEnvValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim().replace(/^['"]|['"]$/g, '')
    if (value) {
      return { name, value }
    }
  }

  return undefined
}

function isValidSupabaseUrl(value: string) {
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function getSupabaseUrl() {
  const found = readEnvValue('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL')

  if (found) {
    if (isValidSupabaseUrl(found.value)) {
      return found.value
    }

    logSupabaseEnvIssue('Invalid Supabase URL detected', {
      expectedEnvNames: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
      receivedValue: found.value,
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    })
  } else {
    logSupabaseEnvIssue('Missing Supabase URL environment variable', {
      expectedEnvNames: ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    })
  }

  return FALLBACK_SUPABASE_URL
}

export function getSupabaseAnonKey() {
  const found = readEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')

  if (found) {
    return found.value
  }

  logSupabaseEnvIssue('Missing Supabase anon key environment variable', {
    expectedEnvNames: ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
    nodeEnv: process.env.NODE_ENV,
    vercel: Boolean(process.env.VERCEL),
  })

  return FALLBACK_SUPABASE_ANON_KEY
}

export function getSupabaseServiceRoleKey() {
  const found = readEnvValue('SUPABASE_SERVICE_ROLE_KEY')

  if (found) {
    return found.value
  }

  logSupabaseEnvIssue('Missing Supabase service role key environment variable', {
    expectedEnvName: 'SUPABASE_SERVICE_ROLE_KEY',
    nodeEnv: process.env.NODE_ENV,
    vercel: Boolean(process.env.VERCEL),
  })

  return FALLBACK_SUPABASE_SERVICE_ROLE_KEY
}
