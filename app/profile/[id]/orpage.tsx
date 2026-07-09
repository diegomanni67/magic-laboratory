"use client"

import { useEffect, useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Home,
  Instagram,
  MapPin,
  MessageCircle,
  Sparkles,
  Store,
  User,
  Youtube,
} from "lucide-react"

type ProfileRecord = {
  id: string
  name: string | null
  role: string | null
  country: string | null
  city: string | null
  artistic_name: string | null
  bio: string | null
  instagram: string | null
  youtube: string | null
  phone: string | null
  avatar: string | null
  is_approved: boolean | null
}

type MarketplaceProduct = {
  id: string
  title: string
  description: string | null
  type: "venta" | "canje"
  price: number | null
  trade_preference: string | null
  image_url: string | null
  created_at: string
}

interface PageProps {
  params: Promise<{ id: string }>
}

// Normaliza un teléfono a solo dígitos para armar el link de wa.me
function toWhatsappDigits(phone: string) {
  return phone.replace(/[^\d]/g, "")
}

export default function Page({ params }: PageProps) {
  const router = useRouter()
  const resolvedParams = use(params)
  const profileId = String(resolvedParams.id)

  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/profile/${profileId}`)
        const data = await res.json()
        if (res.ok) {
          setProfile(data.profile)
          setProducts(data.products ?? [])
        } else {
          setProfile(null)
        }
      } catch {
        setProfile(null)
      } finally {
        setLoading(false)
      }
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

  const displayName = profile.artistic_name || profile.name || "Usuario"
  const whatsappLink = profile.phone ? `https://wa.me/${toWhatsappDigits(profile.phone)}` : null

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

        {/* Tarjeta de presentación artística */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-black/20">
          <div className="h-28 bg-gradient-to-r from-amber-600/40 via-orange-500/30 to-fuchsia-600/40" />
          <div className="-mt-12 px-8 pb-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="flex size-24 items-center justify-center rounded-3xl border-4 border-[#0a0f1e] bg-gradient-to-br from-amber-500 to-orange-600 shadow-xl">
                  <User className="size-10" />
                </div>
                <div className="pb-1">
                  <h1 className="flex items-center gap-2 text-3xl font-semibold">
                    {displayName}
                    {profile.is_approved ? <Sparkles className="size-5 text-amber-300" /> : null}
                  </h1>
                  {profile.artistic_name && profile.name ? (
                    <p className="text-sm text-white/40">{profile.name}</p>
                  ) : null}
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-white/60">
                    <MapPin className="size-4 text-amber-300" />
                    <span>
                      {profile.city || profile.country
                        ? `${profile.city ? `${profile.city}, ` : ""}${profile.country || ""}`
                        : "Ubicación no disponible"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botones de redes */}
              <div className="flex flex-wrap items-center gap-3">
                {profile.instagram ? (
                  <a
                    href={profile.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-2xl border border-pink-500/30 bg-pink-500/10 px-4 py-2 text-sm font-medium text-pink-300 transition hover:bg-pink-500/20"
                  >
                    <Instagram className="size-4" />
                    Instagram
                  </a>
                ) : null}
                {profile.youtube ? (
                  <a
                    href={profile.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
                  >
                    <Youtube className="size-4" />
                    YouTube
                  </a>
                ) : null}
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:opacity-90"
                  >
                    <MessageCircle className="size-4" />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">
                <div className="mb-2 flex items-center gap-2 text-purple-300">
                  <Sparkles className="size-4" />
                  <span className="text-sm font-semibold">Rol</span>
                </div>
                <p>{profile.role || "APPRENTICE"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-4">
                <div className="mb-2 flex items-center gap-2 text-amber-300">
                  <Store className="size-4" />
                  <span className="text-sm font-semibold">Publicaciones en Marketplace</span>
                </div>
                <p>{products.length}</p>
              </div>
            </div>

            {/* Bio destacada */}
            {profile.bio ? (
              <div className="mt-6 rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-6">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Presentación</h3>
                <p className="whitespace-pre-line leading-relaxed text-white/80">{profile.bio}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Productos del marketplace de este usuario */}
        {products.length > 0 ? (
          <div className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Store className="size-5 text-orange-300" />
              Mis Publicaciones en el Marketplace
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <Link
                  key={product.id}
                  href="/marketplace"
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-amber-500/30 hover:bg-white/10"
                >
                  <div className="flex h-28 items-center justify-center bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-fuchsia-500/20">
                    <Sparkles className="size-8 text-amber-300" />
                  </div>
                  <div className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold">{product.title}</h3>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${product.type === "venta" ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300"}`}>
                        {product.type === "venta" ? "Venta" : "Canje"}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs text-white/50">{product.description || "Sin descripción"}</p>
                    <p className="text-xs font-medium text-white/70">
                      {product.type === "venta" ? `$${product.price ?? 0}` : product.trade_preference || "Canje"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
