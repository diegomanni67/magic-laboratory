"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Check, Clock, RefreshCw } from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name: string
  role: string
  is_approved: boolean
  created_at: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)

  const loadUsers = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 403) router.push('/')
        throw new Error(data.error || 'Error al cargar usuarios')
      }
      setUsers(data.users ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const toggleApproval = async (userId: string, is_approved: boolean) => {
    setUpdating(userId)
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, is_approved }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al actualizar')

      setUsers(prev =>
        prev.map(u => (u.id === userId ? { ...u, is_approved } : u))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar')
    } finally {
      setUpdating(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <Shield className="size-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Panel de administración</h1>
              <p className="text-white/50 text-sm">Gestiona el acceso de los usuarios</p>
            </div>
          </div>
          <button
            onClick={loadUsers}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left p-4 text-sm font-medium text-white/70">Usuario</th>
                <th className="text-left p-4 text-sm font-medium text-white/70">Rol</th>
                <th className="text-left p-4 text-sm font-medium text-white/70">Estado</th>
                <th className="text-left p-4 text-sm font-medium text-white/70">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-white/50">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-white/50">
                    No hay usuarios registrados
                  </td>
                </tr>
              ) : (
                users.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="p-4">
                      <div className="font-medium text-white">{user.name}</div>
                      <div className="text-sm text-white/50">{user.email}</div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.is_approved ? (
                        <span className="inline-flex items-center gap-1 text-green-400 text-sm">
                          <Check className="size-4" /> Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-400 text-sm">
                          <Clock className="size-4" /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleApproval(user.id, true)}
                          disabled={user.is_approved || updating === user.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Aprobar
                        </button>
                        <button
                          onClick={() => toggleApproval(user.id, false)}
                          disabled={!user.is_approved || updating === user.id}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Revocar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-xs text-white/40 text-center">
          Para crear un administrador, asigna <code className="text-amber-400">role = &apos;ADMIN&apos;</code> en Supabase.
        </p>
      </div>
    </div>
  )
}
