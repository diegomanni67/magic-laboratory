"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Archive, ExternalLink, Plus, X, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
import { ARCHIVE_CATEGORIES, archiveCategoryLabel } from "@/lib/archivo-categories"

interface ArchiveItem {
  id: string
  title: string
  description: string
  category: string
  link_url: string | null
  added_by: string
  created_at: string
}

export default function ArchivoMaestroPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<ArchiveItem[] | null>(null)
  const [isRealAdmin, setIsRealAdmin] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("master_archive")
        .select("*")
        .order("created_at", { ascending: false })
      setItems(data ?? [])
    }
    load()
  }, [])

  // El contexto de auth del sitio marca a cualquier usuario logueado como
  // "ADMIN" del lado del cliente, así que para esta sección verificamos el
  // rol real contra la base de datos antes de mostrar el panel de curaduría.
  useEffect(() => {
    if (!profile) {
      setIsRealAdmin(false)
      return
    }
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsRealAdmin(d.profile?.role === "ADMIN"))
      .catch(() => setIsRealAdmin(false))
  }, [profile])

  const deleteItem = async (id: string) => {
    const res = await fetch("/api/archivo-maestro", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setItems((prev) => (prev ?? []).filter((i) => i.id !== id))
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-500">
              <Archive className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Archivo Maestro</h1>
              <p className="text-white/50 text-sm">Curaduría de excelencia</p>
            </div>
          </div>
          {isRealAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold hover:from-purple-700 hover:to-fuchsia-700 transition-all shadow-lg shadow-purple-500/20"
            >
              <Plus className="size-5" />
              Agregar al archivo
            </button>
          )}
        </div>

        {items === null ? (
          <p className="text-white/40 text-center py-20">Cargando archivo...</p>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-white/50 mb-2">El archivo todavía está vacío.</p>
            <p className="text-white/30 text-sm">Acá vas a encontrar lo más destacado de la logia, curado a mano.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-purple-500/15 bg-gradient-to-br from-purple-500/[0.06] to-transparent p-5"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                    {archiveCategoryLabel(item.category)}
                  </span>
                  {isRealAdmin && (
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-white/30 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-white/60 mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-white/40">Curado por {item.added_by}</p>
                  {item.link_url && (
                    <a
                      href={item.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-purple-300 hover:text-purple-200"
                    >
                      Ver más <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <NewArchiveItemForm
          authorName={profile?.name}
          onClose={() => setShowForm(false)}
          onCreated={(item) => {
            setItems((prev) => [item, ...(prev ?? [])])
            setShowForm(false)
          }}
        />
      )}
    </div>
  )
}

function NewArchiveItemForm({
  authorName,
  onClose,
  onCreated,
}: {
  authorName?: string
  onClose: () => void
  onCreated: (item: ArchiveItem) => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [category, setCategory] = useState(ARCHIVE_CATEGORIES[0].value)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      setError("Completá título y descripción")
      return
    }
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/archivo-maestro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          category,
          link_url: linkUrl,
          added_by: authorName,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al guardar")
      onCreated(data.item)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0a0f1e] p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-white">Agregar al Archivo Maestro</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {ARCHIVE_CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    category === c.value
                      ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
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
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/40"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Descripción</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/40 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-white/60 mb-1.5 block">Link (opcional)</label>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500/40"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-semibold hover:from-purple-700 hover:to-fuchsia-700 transition-all disabled:opacity-50"
          >
            {submitting ? "Guardando..." : "Agregar al archivo"}
          </button>
        </div>
      </div>
    </div>
  )
}
