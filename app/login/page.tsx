"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import Link from 'next/link'
import { Mail, Eye, EyeOff, Wand2 } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/'

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Credenciales incorrectas')
        return
      }

      if (data.is_approved) {
        router.push(redirect)
      } else {

      }
      router.refresh()
    } catch {
      setError('Error al iniciar sesión')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
            <Wand2 className="size-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Magic Laboratory</h1>
          <p className="text-white/50">Inicia sesión en tu cuenta</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  placeholder="tu@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-amber-500/50 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
            >
              {isLoading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/50">
            ¿No tienes cuenta?{' '}
            <Link href="/registro" className="text-amber-400 hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
