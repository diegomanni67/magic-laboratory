import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/registro',
  '/auth',
  '/esperando-aprobacion',
]

const AUTH_PATHS = ['/login', '/registro', '/auth']

function isPublicPath(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true
  if (pathname.startsWith('/api/auth/signup')) return true
  if (pathname.startsWith('/api/auth/login')) return true
  if (pathname.startsWith('/auth/callback')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.includes('.')) return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { supabase, user, supabaseResponse } = await updateSession(request)

  // API routes: auth endpoints handle their own logic
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/auth/signup') || pathname.startsWith('/api/auth/login')) {
      return supabaseResponse
    }
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    return supabaseResponse
  }

  if (isPublicPath(pathname)) {
    if (user && AUTH_PATHS.includes(pathname)) {
      const { data: profile } = await supabase
        .from('users')
        .select('is_approved')
        .eq('id', user.id)
        .single()

      const url = request.nextUrl.clone()
      url.pathname = profile?.is_approved ? '/' : '/esperando-aprobacion'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_approved, role')
    .eq('id', user.id)
    .single()

  if (pathname.startsWith('/admin')) {
    if (profile?.role !== 'ADMIN') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  if (!profile?.is_approved && pathname !== '/esperando-aprobacion') {
    const url = request.nextUrl.clone()
    url.pathname = '/esperando-aprobacion'
    return NextResponse.redirect(url)
  }

  if (profile?.is_approved && pathname === '/esperando-aprobacion') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
