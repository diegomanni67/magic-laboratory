"use client"

import { useAuth } from '@/components/auth/AuthProvider'
import { Clock, LogOut } from 'lucide-react'

export default function EsperandoAprobacionPage() {
  const { profile, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-amber-500/20 border border-amber-500/30">
          <Clock className="size-10 text-amber-400" />
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Esperando aprobación
        </h1>

        <p className="text-white/60 mb-2">
          Tu cuenta{profile?.email ? ` (${profile.email})` : ''} fue registrada correctamente.
        </p>
        <p className="text-white/60 mb-8">
          Un administrador revisará tu solicitud y te notificará cuando tengas acceso al laboratorio.
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-6">
          <p className="text-sm text-white/50">
            Mientras tanto, puedes cerrar sesión y volver más tarde. Recibirás acceso automáticamente una vez aprobado.
          </p>
        </div>

        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          <LogOut className="size-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
