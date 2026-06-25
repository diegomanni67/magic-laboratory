import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/login', '/registro', '/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { user, supabaseResponse } = await updateSession(request)

  // Si es ruta pública, deja pasar
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/api/auth/')) {
    return supabaseResponse
  }

  // Si no hay usuario y no es ruta pública, manda al login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay usuario, deja pasar a todo lo demás
  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}