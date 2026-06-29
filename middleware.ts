import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseAnonKey, getSupabaseUrl } from './lib/supabase/env'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()

  if (!url || !key) {
    console.error('[supabase] Middleware initialization skipped because env vars are missing', {
      hasUrl: Boolean(url),
      hasAnonKey: Boolean(key),
      urlPreview: url ? url.slice(0, 40) : '(missing)',
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    })
  }

  const supabase = createServerClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-key',
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Esto refresca el token de sesión si es necesario
  try {
    await supabase.auth.getUser()
  } catch (error) {
    console.error('[supabase] Middleware auth check failed', {
      error,
      hasUrl: Boolean(url),
      hasAnonKey: Boolean(key),
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    })
  }

  return response
}

export const config = {
  matcher: [
    // Aplica el middleware a todas las rutas excepto archivos estáticos e imágenes
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}// Forzando reconstrucción de variables limpias