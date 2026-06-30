"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Instagram, MapPin, Search, Sparkles, User, Users, Youtube } from "lucide-react"

type Member = {
  id: string
  name: string | null
  artistic_name: string | null
  role: string | null
  country: string | null
  city: string | null
  bio: string | null
  instagram: string | null
  youtube: string | null
  avatar: string | null
}

export default function CommunityPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/community")
        const data = await res.json()
        setMembers(data.members ?? [])
      } catch {
        setMembers([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      (m.name ?? "").toLowerCase().includes(q) ||
      (m.artistic_name ?? "").toLowerCase().includes(q) ||
      (m.city ?? "").toLowerCase().includes(q) ||
      (m.country ?? "").toLowerCase().includes(q) ||
      (m.role ?? "").toLowerCase().includes(q)
    )
  })

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>

        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-amber-400">Comunidad</p>
          <h1 className="flex items-center gap-3 text-3xl font-semibold">
            <Users className="size-7 text-amber-300" />
            Miembros del Laboratorio
          </h1>
          <p className="mt-2 text-white/50">
            {loading ? "Cargando..." : `${members.length} ilusionistas en la comunidad`}
          </p>
        </div>

        {/* Buscador */}
        <div className="mb-8 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 max-w-md">
          <Search className="size-4 shrink-0 text-white/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, ciudad, rol..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/30"
          />
        </div>

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/40">
            Cargando miembros...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-white/40">
            No se encontraron miembros.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((member) => {
              const displayName = member.artistic_name || member.name || "Mago"
              return (
                <Link
                  key={member.id}
                  href={`/profile/${member.id}`}
                  className="group rounded-3xl border border-white/10 bg-white/5 p-5 transition hover:border-amber-500/40 hover:bg-white/10"
                >
                  {/* Avatar */}
                  <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-2xl font-bold shadow-lg">
                    {displayName.charAt(0).toUpperCase()}
                  </div>

                  <h3 className="font-semibold text-white group-hover:text-amber-300 transition-colors">
                    {displayName}
                  </h3>

                  {member.artistic_name && member.name ? (
                    <p className="text-xs text-white/40">{member.name}</p>
                  ) : null}

                  <p className="mt-1 text-xs font-medium text-amber-400/80">{member.role || "APPRENTICE"}</p>

                  {(member.city || member.country) ? (
                    <div className="mt-2 flex items-center gap-1 text-xs text-white/40">
                      <MapPin className="size-3 shrink-0" />
                      <span>{[member.city, member.country].filter(Boolean).join(", ")}</span>
                    </div>
                  ) : null}

                  {member.bio ? (
                    <p className="mt-3 line-clamp-2 text-xs text-white/50">{member.bio}</p>
                  ) : null}

                  {(member.instagram || member.youtube) ? (
                    <div className="mt-3 flex items-center gap-2">
                      {member.instagram ? <Instagram className="size-3.5 text-pink-400" /> : null}
                      {member.youtube ? <Youtube className="size-3.5 text-red-400" /> : null}
                    </div>
                  ) : null}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
