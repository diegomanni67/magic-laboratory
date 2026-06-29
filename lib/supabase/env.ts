function readEnvValue(...names: string[]) {
  for (const name of names) {
    const value = process.env[name]?.trim().replace(/^['"]|['"]$/g, '')
    if (value) return value
  }

  return undefined
}

export function getSupabaseUrl() {
  const url = readEnvValue('NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_URL')

  if (!url) {
    throw new Error('Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) in your environment.')
  }

  try {
    new URL(url)
  } catch {
    throw new Error(`Invalid Supabase URL: ${url}`)
  }

  return url
}

export function getSupabaseAnonKey() {
  const key = readEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY')

  if (!key) {
    throw new Error('Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) in your environment.')
  }

  return key
}

export function getSupabaseServiceRoleKey() {
  const key = readEnvValue('SUPABASE_SERVICE_ROLE_KEY')

  if (!key) {
    throw new Error('Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY in your environment.')
  }

  return key
}
