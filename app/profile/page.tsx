"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
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
  studies: string | null
  teacher: string | null
  avatar_url: string | null
}

export default function ProfilePage() {
  const router = useRouter()

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingSession, setCheckingSession] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [form, setForm] = useState({
    name: "",
    artistic_name: "",
    bio: "",
    instagram: "",
    youtube: "",
    phone: "",
    studies: "",
    teacher: "",
  })

  const loadProfile = async () => {
    setLoading(true)

    const res = await fetch("/api/me")
    const data = await res.json()

    setProfile(data.profile)

    if (data.profile) {
      setForm({
        name: data.profile.name || "",
        artistic_name: data.profile.artistic_name || "",
        bio: data.profile.bio || "",
        instagram: data.profile.instagram || "",
        youtube: data.profile.youtube || "",
        phone: data.profile.phone || "",
        studies: data.profile.studies || "",
        teacher: data.profile.teacher || "",
      })
    }

    setLoading(false)
  }

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

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]

    if (!file) return

    setUploadingAvatar(true)

    try {
      const formData = new FormData()
      formData.append("avatar", file)

      const res = await fetch("/api/avatar", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "No se pudo subir la imagen")
        return
      }

      toast.success("Avatar actualizado")
      await loadProfile()

    } catch {
      toast.error("Error subiendo avatar")
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    setSaving(true)

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "No se pudo guardar")
        return
      }

      toast.success("Perfil actualizado")
      await loadProfile()

    } catch {
      toast.error("Error guardando perfil")
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
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e] px-6 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="mb-3 text-2xl font-semibold">
            Todavía no hay perfil disponible
          </h1>

          <Link
            href="/login"
            className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 font-semibold"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    )
  }  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
          >
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

                {/* AVATAR CON SUBIDA */}
                <div className="relative">

                  <div className="flex size-24 items-center justify-center overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600">

                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt="Avatar"
                        className="size-full object-cover"
                      />
                    ) : (
                      <Sparkles className="size-8" />
                    )}

                  </div>


                  <label
                    className="absolute bottom-0 right-0 flex size-9 cursor-pointer items-center justify-center rounded-full bg-amber-500 text-black shadow-lg transition hover:scale-110"
                  >

                    {uploadingAvatar ? (
                      <span className="text-xs">...</span>
                    ) : (
                      <Camera className="size-4" />
                    )}


                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    />

                  </label>

                </div>


                <div>
                  <h1 className="text-2xl font-semibold">
                    {profile.artistic_name || profile.name || "Usuario"}
                  </h1>

                  <p className="text-sm text-white/50">
                    {profile.email}
                  </p>
                </div>

              </div>



              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">

                <BadgeCheck className="size-4" />

                {profile.is_approved
                  ? "Aprobado"
                  : "Pendiente de aprobación"}

              </div>


            </div>



            <div className="mt-6 grid gap-4 sm:grid-cols-3">


              <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">
                <p className="text-sm text-white/50">
                  Rol
                </p>

                <p className="mt-1 font-semibold">
                  {profile.role || "APPRENTICE"}
                </p>
              </div>



              <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">

                <p className="text-sm text-white/50">
                  Ubicación
                </p>

                <p className="mt-1 font-semibold">
                  {profile.city
                    ? `${profile.city}, `
                    : ""}
                  {profile.country || "Sin definir"}
                </p>

              </div>



              <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">

                <p className="text-sm text-white/50">
                  Estado
                </p>

                <p className="mt-1 font-semibold">
                  {profile.is_approved
                    ? "Activo"
                    : "En revisión"}
                </p>

              </div>


            </div>


            <form
              onSubmit={handleSubmit}
              className="mt-6 rounded-3xl border border-white/10 bg-[#0b1224] p-5"
            >

              <h2 className="mb-1 text-lg font-semibold">
                Tu perfil artístico
              </h2>

              <p className="mb-5 text-sm text-white/50">
                Esto es lo que verán otros usuarios.
              </p>


              <div className="space-y-4">


                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Nombre real
                  </label>

                  <input
                    value={form.name}
                    onChange={(e)=>setForm({...form,name:e.target.value})}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  />
                </div>


                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Nombre artístico
                  </label>

                  <input
                    value={form.artistic_name}
                    onChange={(e)=>setForm({...form,artistic_name:e.target.value})}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  />
                </div>


                <div>
                  <label className="mb-1 block text-sm text-white/70">
                    Biografía
                  </label>

                  <textarea
                    value={form.bio}
                    onChange={(e)=>setForm({...form,bio:e.target.value})}
                    rows={5}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  />
                </div>                <div className="grid gap-4 sm:grid-cols-2">

                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm text-white/70">
                      <Instagram className="size-4 text-pink-400" />
                      Instagram
                    </label>

                    <input
                      value={form.instagram}
                      onChange={(e)=>setForm({...form,instagram:e.target.value})}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    />
                  </div>


                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm text-white/70">
                      <Youtube className="size-4 text-red-400" />
                      YouTube
                    </label>

                    <input
                      value={form.youtube}
                      onChange={(e)=>setForm({...form,youtube:e.target.value})}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    />
                  </div>

                </div>


                <div>

                  <label className="mb-1 flex items-center gap-2 text-sm text-white/70">
                    <Phone className="size-4 text-emerald-400" />
                    WhatsApp
                  </label>

                  <input
                    value={form.phone}
                    onChange={(e)=>setForm({...form,phone:e.target.value})}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  />

                </div>



                <div>

                  <label className="mb-1 block text-sm text-white/70">
                    Estudios mágicos
                  </label>

                  <input
                    value={form.studies}
                    onChange={(e)=>setForm({...form,studies:e.target.value})}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  />

                </div>



                <div>

                  <label className="mb-1 block text-sm text-white/70">
                    Profesor / Mentor
                  </label>

                  <input
                    value={form.teacher}
                    onChange={(e)=>setForm({...form,teacher:e.target.value})}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                  />

                </div>


              </div>


              <button
                type="submit"
                disabled={saving}
                className="mt-5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 font-semibold"
              >
                {saving ? "Guardando..." : "Guardar perfil artístico"}
              </button>


            </form>


            <div className="mt-6 rounded-3xl border border-white/10 bg-[#0b1224] p-5">

              <h2 className="mb-3 text-lg font-semibold">
                Acciones rápidas
              </h2>


              <div className="grid gap-3 sm:grid-cols-2">

                <Link
                  href="/laboratorio"
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <FlaskConical className="size-5 text-amber-300" />
                  Ver laboratorio
                </Link>


                <Link
                  href="/marketplace"
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <Store className="size-5 text-orange-300" />
                  Marketplace
                </Link>

              </div>

            </div>


          </div>



          <div className="space-y-6">

            <LocationEditor
              initialCountry={profile.country}
              initialCity={profile.city}
              onUpdated={loadProfile}
            />


            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">

              <div className="mb-4 flex items-center gap-3">

                <div className="flex size-10 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-300">

                  <MapPin className="size-5" />

                </div>


                <div>

                  <h3 className="font-semibold">
                    Tu comunidad
                  </h3>

                  <p className="text-sm text-white/50">
                    Compartí tu ubicación para conectar.
                  </p>

                </div>

              </div>


              <p className="text-sm text-white/60">
                Completá tu ciudad y país para aparecer en la comunidad.
              </p>


            </div>


          </div>


        </div>


      </div>

    </div>
  )
}