"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, FlaskConical, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { PracticeCard, type PracticeVideo } from "@/components/laboratorio/PracticeCard"
import { NewPracticeForm } from "@/components/laboratorio/NewPracticeForm"

export default function LaboratorioPage() {
  const [videos, setVideos] = useState<PracticeVideo[] | null>(null)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("practice_videos")
        .select("*")
        .order("created_at", { ascending: false })
      setVideos(data ?? [])
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
              <FlaskConical className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Laboratorio</h1>
              <p className="text-white/50 text-sm">Taller de técnica y mejora</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/20"
          >
            <Plus className="size-5" />
            Compartir mi práctica
          </button>
        </div>

        {videos === null ? (
          <p className="text-white/40 text-center py-20">Cargando prácticas...</p>
        ) : videos.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/50 mb-2">Todavía no hay prácticas compartidas.</p>
            <p className="text-white/30 text-sm">Sé el primer mago en subir tu material.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {videos.map((v) => (
              <PracticeCard key={v.id} video={v} />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <NewPracticeForm
          onClose={() => setShowForm(false)}
          onCreated={(video) => {
            setVideos((prev) => [video, ...(prev ?? [])])
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}
