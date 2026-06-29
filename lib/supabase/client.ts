import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

export function createClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  return createBrowserClient(url, key, {
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
