import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  if (!url || !key) {
    console.error('[supabase] Browser client skipped because env vars are missing', {
      hasUrl: Boolean(url),
      hasAnonKey: Boolean(key),
      urlPreview: url ? url.slice(0, 40) : '(missing)',
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    })
  }

  return createBrowserClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key', {
    cookies: {
      getAll() {
        return document.cookie.split(';').map((cookie) => {
          const [name, value] = cookie.trim().split('=')
          return { name, value }
        })
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=${options?.path ?? '/'}; max-age=${options?.maxAge ?? 0}; sameSite=${options?.sameSite ?? 'lax'}`
        })
      },
    },
  })
}
