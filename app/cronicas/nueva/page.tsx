"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { STORY_CATEGORIES } from "@/lib/cronicas-categories"

export default function NuevaCronicaPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [category, setCategory] = useState(STORY_CATEGORIES[0].value)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!profile) {
      setError("Tenés que iniciar sesión para publicar")
      return
    }
    if (!title.trim() || !content.trim()) {
      setError("Completá el título y el relato")
      return
    }

    setSubmitting(true)
    setError("")
    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from("stories")
      .insert({
        title: title.trim(),
        content: content.trim(),
        category,
        author: profile.name,
        author_email: profile.email,
      })
      .select()
      .single()

    if (insertError) {
      setError("No se pudo publicar. Probá de nuevo.")
      setSubmitting(false)
      return
    }

    router.push(`/cronicas/${data.id}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/cronicas" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft className="size-4" />
          Volver a Crónicas
        </Link>

        <h1 className="text-2xl font-bold text-white mb-1">Contar mi historia</h1>
        <p className="text-white/50 text-sm mb-8">
          Una anécdota, una reseña de un lugar donde trabajaste, un consejo para otros magos... lo que quieras compartir.
        </p>

        {!profile && (
          <div className="mb-5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            Necesitás <a href="/login" className="underline">iniciar sesión</a> para publicar.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Tipo de relato</label>
            <div className="flex flex-wrap gap-2">
              {STORY_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    category === c.value
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      : "bg-white/[0.04] border-white/10 text-white/50 hover:bg-white/[0.08]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: La vez que se me cayó el mazo en pleno show"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Tu relato</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Contá la historia con todo el detalle que quieras..."
              rows={10}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40 resize-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50"
          >
            {submitting ? "Publicando..." : "Publicar crónica"}
          </button>
        </div>
      </div>
    </div>
  )
}
