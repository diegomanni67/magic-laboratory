"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Send } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"
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

interface StoryComment {
  id: string
  story_id: string
  author: string
  content: string
  created_at: string
}

export default function CronicaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { profile } = useAuth()
  const [story, setStory] = useState<Story | null>(null)
  const [comments, setComments] = useState<StoryComment[]>([])
  const [commentText, setCommentText] = useState("")
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [{ data: storyData }, { data: commentsData }] = await Promise.all([
        supabase.from("stories").select("*").eq("id", id).single(),
        supabase
          .from("story_comments")
          .select("*")
          .eq("story_id", id)
          .order("created_at", { ascending: true }),
      ])
      setStory(storyData)
      setComments(commentsData ?? [])
      supabase.rpc("increment_story_views", { story_id: id })
    }
    load()
  }, [id])

  const submitComment = async () => {
    if (!profile) {
      setError("Tenés que iniciar sesión para comentar")
      return
    }
    if (!commentText.trim()) return

    setPosting(true)
    setError("")
    const supabase = createClient()
    const { data, error: insertError } = await supabase
      .from("story_comments")
      .insert({
        story_id: id,
        author: profile.name,
        author_email: profile.email,
        content: commentText.trim(),
      })
      .select()
      .single()

    if (insertError) {
      setError("No se pudo publicar el comentario")
    } else {
      setComments((prev) => [...prev, data])
      setCommentText("")
    }
    setPosting(false)
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center">
        <p className="text-white/40">Cargando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/cronicas" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-6">
          <ArrowLeft className="size-4" />
          Volver a Crónicas
        </Link>

        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/20">
          {storyCategoryLabel(story.category)}
        </span>

        <h1 className="text-3xl font-bold text-white mt-3 mb-2">{story.title}</h1>
        <p className="text-sm text-white/40 mb-8">
          Por <span className="text-white/70">{story.author}</span> ·{" "}
          {new Date(story.created_at).toLocaleDateString("es-AR")}
        </p>

        <p className="text-white/80 leading-relaxed whitespace-pre-line mb-10">{story.content}</p>

        <div className="pt-8 border-t border-white/[0.06]">
          <p className="text-sm font-semibold text-white/80 mb-4">
            Comentarios {comments.length > 0 ? `(${comments.length})` : ""}
          </p>

          <div className="space-y-3 mb-5">
            {comments.length === 0 && (
              <p className="text-sm text-white/40">Todavía no hay comentarios.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="rounded-xl bg-white/[0.04] p-3">
                <p className="text-sm text-white/80">{c.content}</p>
                <p className="text-xs text-white/40 mt-1">
                  {c.author} · {new Date(c.created_at).toLocaleDateString("es-AR")}
                </p>
              </div>
            ))}
          </div>

          {profile ? (
            <div className="flex gap-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Dejá tu comentario..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-blue-500/40"
                onKeyDown={(e) => e.key === "Enter" && submitComment()}
              />
              <button
                onClick={submitComment}
                disabled={posting}
                className="px-3 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Send className="size-4" />
              </button>
            </div>
          ) : (
            <p className="text-sm text-white/40">
              <a href="/login" className="text-blue-400 hover:underline">Iniciá sesión</a> para comentar.
            </p>
          )}
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}
