"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import type { PracticeVideo } from "./PracticeCard"

const CATEGORIES = ["Manipulación", "Cartomagia", "Mentalismo", "Escapismo", "Close-up", "Otro"]
const LEVELS = ["Principiante", "Intermedio", "Avanzado"]

export function NewPracticeForm({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (video: PracticeVideo) => void
}) {
  const { profile } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [category, setCategory] = useState(CATEGORIES[0])
  const [level, setLevel] = useState(LEVELS[0])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!profile) {
      setError("Tenés que iniciar sesión para compartir una práctica")
      return
    }
    if (!title.trim() || !description.trim() || !videoUrl.trim()) {
      setError("Completá título, descripción y el link de tu material")
      return
    }

    setSubmitting(true)
    setError("")
    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from("practice_videos")
      .insert({
        title: title.trim(),
        description: description.trim(),
        video_url: videoUrl.trim(),
        author: profile.name,
        author_email: profile.email,
        author_role: profile.role ?? "MEMBER",
        technique_category: category,
        difficulty_level: level,
      })
      .select()
      .single()

    if (insertError) {
      setError("No se pudo publicar. Probá de nuevo.")
      setSubmitting(false)
      return
    }

    onCreated(data)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Compartir mi práctica</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        {!profile && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm">
            Necesitás <a href="/login" className="underline">iniciar sesión</a> para publicar.
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Vanish de moneda con guante"
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contá qué estás practicando y en qué querés feedback"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">
              Link de tu video o material (YouTube, Drive, etc.)
            </label>
            <input
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-amber-500/40"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-white/60 mb-1.5 block">Nivel</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-amber-500/40"
              >
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50"
          >
            {submitting ? "Publicando..." : "Publicar práctica"}
          </button>
        </div>
      </div>
    </div>
  )
}
