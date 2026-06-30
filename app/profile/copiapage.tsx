"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, BadgeCheck, FlaskConical, MapPin, Sparkles, Store } from "lucide-react"
import { LocationEditor } from "@/components/profile/LocationEditor"

type ProfileData = {
  id: string
  name: string | null
  email: string | null
  role: string | null
  country: string | null
  city: string | null
  is_approved: boolean | null
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    setLoading(true)
    const res = await fetch("/api/me")
    const data = await res.json()
    setProfile(data.profile)
    setLoading(false)
  }

  useEffect(() => {
    void loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e] text-white/70">
        Cargando perfil...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e] px-6 text-center text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/5 p-8">
          <h1 className="mb-3 text-2xl font-semibold">Todavía no hay perfil disponible</h1>
          <p className="mb-6 text-white/60">Iniciá sesión para ver tus datos y completar tu ubicación.</p>
          <Link href="/login" className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 font-semibold">
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <Sparkles className="size-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{profile.name || "Usuario"}</h1>
                  <p className="text-sm text-white/50">{profile.email}</p>
                </div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                <BadgeCheck className="size-4" />
                {profile.is_approved ? "Aprobado" : "Pendiente de aprobación"}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">
                <p className="text-sm text-white/50">Rol</p>
                <p className="mt-1 font-semibold">{profile.role || "APPRENTICE"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">
                <p className="text-sm text-white/50">Ubicación</p>
                <p className="mt-1 font-semibold">{profile.city ? `${profile.city}, ` : ""}{profile.country || "Sin definir"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">
                <p className="text-sm text-white/50">Estado</p>
                <p className="mt-1 font-semibold">{profile.is_approved ? "Activo" : "En revisión"}</p>
              </div>
            </div>

            <div className="mt-6 rounded-3xl border border-white/10 bg-[#0b1224] p-5">
              <h2 className="mb-3 text-lg font-semibold">Acciones rápidas</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Link href="/laboratorio" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
                  <FlaskConical className="size-5 text-amber-300" />
                  <span>Ver laboratorio</span>
                </Link>
                <Link href="/marketplace" className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
                  <Store className="size-5 text-orange-300" />
                  <span>Ir al marketplace</span>
                </Link>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <LocationEditor initialCountry={profile.country} initialCity={profile.city} onUpdated={loadProfile} />

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300">
                  <MapPin className="size-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Tu comunidad</h3>
                  <p className="text-sm text-white/50">Comparte tu ubicación para conectar con otros miembros.</p>
                </div>
              </div>
              <p className="text-sm text-white/60">
                Cuando completes tu ciudad y país, podrás encontrar personas cercanas en el laboratorio y en el marketplace.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
