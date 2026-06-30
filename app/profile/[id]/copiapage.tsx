"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Home, MapPin, Sparkles, User } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type ProfileRecord = {
  id: string
  name: string | null
  email: string | null
  role: string | null
  country: string | null
  city: string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default function Page({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const profileId = String(resolvedParams.id)
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email, role, country, city")
        .eq("id", profileId)
        .maybeSingle()

      if (!error) {
        setProfile(data as ProfileRecord | null)
      }
      setLoading(false)
    }

    void loadProfile()
  }, [profileId])

  const handleGoBack = () => {
    if (window.history.length > 2) {
      window.history.back()
    } else {
      router.push("/community")
    }
  }

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
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
          <h2 className="mb-2 text-2xl font-semibold">Perfil no encontrado</h2>
          <p className="mb-6 text-white/60">El perfil que buscas no está disponible.</p>
          <button onClick={handleGoBack} className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 font-semibold">
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={handleGoBack} className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <ArrowLeft className="size-4" />
            </button>
            <Link href="/" className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <Home className="size-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/20">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
              <User className="size-7" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">{profile.name || "Usuario"}</h1>
              <p className="text-sm text-white/50">{profile.email}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-300">
                <MapPin className="size-4" />
                <span className="text-sm font-semibold">Ubicación</span>
              </div>
              <p>{profile.city ? `${profile.city}, ` : ""}{profile.country || "Sin definir"}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">
              <div className="mb-2 flex items-center gap-2 text-purple-300">
                <Sparkles className="size-4" />
                <span className="text-sm font-semibold">Rol</span>
              </div>
              <p>{profile.role || "APPRENTICE"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
