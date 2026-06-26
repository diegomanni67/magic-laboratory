import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PUBLIC_PATHS = ['/', '/login']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const { user, supabaseResponse } = await updateSession(request)

  // Si es ruta pública, deja pasar
  if (PUBLIC_PATHS.includes(pathname)) {
    return supabaseResponse
  }

  // Si es endpoint de API de autenticación, deja pasar
  if (pathname.startsWith('/api/auth/')) {
    return supabaseResponse
  }

  // Si no hay usuario y no es ruta pública, redirigir al login
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay usuario, deja pasar a todo lo demás
  return supabaseResponse
}

export const config = {
  matcher: [
    // Excluir archivos estáticos, imágenes, favicon, y archivos de Next.js
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}