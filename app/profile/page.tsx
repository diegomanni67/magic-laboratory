"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  BadgeCheck,
  ExternalLink,
  FlaskConical,
  Instagram,
  MapPin,
  Phone,
  Sparkles,
  Store,
  Youtube,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { LocationEditor } from "@/components/profile/LocationEditor"

type ProfileData = {
  id: string
  name: string | null
  email: string | null
  role: string | null
  country: string | null
  city: string | null
  is_approved: boolean | null
  artistic_name: string | null
  bio: string | null
  instagram: string | null
  youtube: string | null
  phone: string | null
}

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingSession, setCheckingSession] = useState(true)

  const [form, setForm] = useState({
    artistic_name: "",
    bio: "",
    instagram: "",
    youtube: "",
    phone: "",
  })
  const [saving, setSaving] = useState(false)

  const loadProfile = async () => {
    setLoading(true)
    const res = await fetch("/api/me")
    const data = await res.json()
    setProfile(data.profile)
    if (data.profile) {
      setForm({
        artistic_name: data.profile.artistic_name || "",
        bio: data.profile.bio || "",
        instagram: data.profile.instagram || "",
        youtube: data.profile.youtube || "",
        phone: data.profile.phone || "",
      })
    }
    setLoading(false)
  }

  // Ruta protegida: si no hay sesión activa de Supabase, redirige al login.
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.replace("/login")
        return
      }

      setCheckingSession(false)
      void loadProfile()
    }

    void checkSession()
  }, [router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "No se pudo guardar el perfil")
        return
      }

      toast.success("Perfil artístico actualizado")
      void loadProfile()
    } catch {
      toast.error("No se pudo guardar el perfil. Probá de nuevo.")
    } finally {
      setSaving(false)
    }
  }

  if (checkingSession || loading) {
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
          <p className="mb-6 text-white/60">Iniciá sesión para ver tus datos y completar tu perfil artístico.</p>
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>
          <Link
            href={`/profile/${profile.id}`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            <ExternalLink className="size-4" />
            Ver mi perfil público
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600">
                  <Sparkles className="size-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">{profile.artistic_name || profile.name || "Usuario"}</h1>
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

            {/* Formulario de perfil artístico */}
            <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-white/10 bg-[#0b1224] p-5">
              <h2 className="mb-1 text-lg font-semibold">Tu perfil artístico</h2>
              <p className="mb-5 text-sm text-white/50">
                Esto es lo que van a ver otros usuarios en tu perfil público y en tus publicaciones.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-white/70">Nombre artístico</label>
                  <input
                    value={form.artistic_name}
                    onChange={(e) => setForm({ ...form, artistic_name: e.target.value })}
                    placeholder="Ej: El Gran Manni"
                    maxLength={160}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-white/70">Biografía / Presentación</label>
                  <textarea
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    placeholder="Contá tu trayectoria, tu estilo, qué tipo de magia hacés..."
                    maxLength={1000}
                    rows={5}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/50"
                  />
                  <p className="mt-1 text-right text-xs text-white/30">{form.bio.length}/1000</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-white/70">
                      <Instagram className="size-4 text-pink-400" />
                      Instagram
                    </label>
                    <input
                      value={form.instagram}
                      onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                      placeholder="https://instagram.com/tu_usuario"
                      maxLength={160}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium text-white/70">
                      <Youtube className="size-4 text-red-400" />
                      YouTube
                    </label>
                    <input
                      value={form.youtube}
                      onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                      placeholder="https://youtube.com/@tu_canal"
                      maxLength={160}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium text-white/70">
                    <Phone className="size-4 text-emerald-400" />
                    Teléfono / WhatsApp de contacto
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="Ej: 5491122334455 (con código de país, sin espacios)"
                    maxLength={160}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 font-semibold transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
              >
                {saving ? "Guardando..." : "Guardar perfil artístico"}
              </button>
            </form>

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
