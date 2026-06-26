import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }

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
