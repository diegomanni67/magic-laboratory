import { NextResponse } from 'next/server'

export async function GET() {
  // Simulamos un perfil de usuario activo siempre, 
  // ignorando la validación real de Supabase por ahora
  return NextResponse.json({
    profile: {
      id: 'mock-user-id',
      email: 'usuario@magic.com',
      name: 'Usuario Logueado',
      role: 'ADMIN',
      is_approved: true
    }
  })
}