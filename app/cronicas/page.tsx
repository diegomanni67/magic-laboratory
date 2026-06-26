"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ScrollText, Plus, Eye } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { storyCategoryLabel } from "@/lib/cronicas-categories"

interface Story {
  id: string
  title: string
  content: string
  category: string
  author: string
  created_at: string
  views: number
}

export default function CronicasPage() {
  const [stories, setStories] = useState<Story[] | null>(null)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false })
      setStories(data ?? [])
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500">
              <ScrollText className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Crónicas</h1>
              <p className="text-white/50 text-sm">Relatos y experiencias</p>
            </div>
          </div>
          <Link
            href="/cronicas/nueva"
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/20"
          >
            <Plus className="size-5" />
            Contar mi historia
          </Link>
        </div>

        {stories === null ? (
          <p className="text-white/40 text-center py-20">Cargando crónicas...</p>
        ) : stories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/50 mb-2">Todavía no hay crónicas.</p>
            <p className="text-white/30 text-sm">Contá la primera anécdota de la logia.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((s) => (
              <Link
                key={s.id}
                href={`/cronicas/${s.id}`}
                className="block rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 hover:border-white/[0.15] hover:bg-white/[0.05] transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
                    {storyCategoryLabel(s.category)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-white/30 ml-auto">
                    <Eye className="size-3.5" />
                    {s.views}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white mb-1">{s.title}</h2>
                <p className="text-sm text-white/60 line-clamp-2 mb-2">{s.content}</p>
                <p className="text-xs text-white/40">
                  Por <span className="text-white/70">{s.author}</span> ·{" "}
                  {new Date(s.created_at).toLocaleDateString("es-AR")}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
