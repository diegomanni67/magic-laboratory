"use client"

import { useState } from "react"
import {
  MessageCircle,
  Sparkles,
  ExternalLink,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/components/auth/AuthProvider"

export interface PracticeVideo {
  id: string
  title: string
  description: string
  video_url: string
  author: string
  author_email: string
  technique_category: string
  difficulty_level: string
  created_at: string
  tags: string[]
}

export interface PracticeComment {
  id: string
  video_id: string
  author: string
  author_email: string
  content: string
  created_at: string
}

export interface AIAnalysisRow {
  id: string
  analysis_text: string
  technical_score: number
  performance_score: number
  suggestions: string[]
  strengths: string[]
  areas_for_improvement: string[]
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export function PracticeCard({ video }: { video: PracticeVideo }) {
  const { profile } = useAuth()
  const [expanded, setExpanded] = useState(false)
  const [comments, setComments] = useState<PracticeComment[] | null>(null)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [posting, setPosting] = useState(false)
  const [analysis, setAnalysis] = useState<AIAnalysisRow | null | undefined>(undefined)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")

  const embedUrl = getYouTubeEmbedUrl(video.video_url)

  const loadExtras = async () => {
    if (expanded) {
      setExpanded(false)
      return
    }
    setExpanded(true)
    if (comments === null || comments === undefined) {
      setLoadingComments(true)
      const supabase = createClient()
      const [{ data: commentsData }, { data: analysisData }] = await Promise.all([
        supabase
          .from("practice_comments")
          .select("*")
          .eq("video_id", video.id)
          .order("created_at", { ascending: true }),
        supabase
          .from("ai_analyses")
          .select("*")
          .eq("video_id", video.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      setComments(commentsData ?? [])
      setAnalysis(analysisData ?? null)
      setLoadingComments(false)
    }
  }

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
      .from("practice_comments")
      .insert({
        video_id: video.id,
        author: profile.name,
        author_email: profile.email,
        content: commentText.trim(),
      })
      .select()
      .single()

    if (insertError) {
      setError("No se pudo publicar el comentario")
    } else {
      setComments((prev) => [...(prev ?? []), data])
      setCommentText("")
    }
    setPosting(false)
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    setError("")
    try {
      const res = await fetch("/api/laboratorio/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al analizar")
      setAnalysis(data.analysis)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar la práctica")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      {embedUrl ? (
        <div className="aspect-video w-full bg-black">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <a
          href={video.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 h-28 bg-white/[0.04] text-amber-300 hover:bg-white/[0.07] transition-colors text-sm font-medium"
        >
          <ExternalLink className="size-4" />
          Ver práctica
        </a>
      )}

      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
            {video.technique_category}
          </span>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/[0.06] text-white/60 border border-white/10">
            {video.difficulty_level}
          </span>
        </div>

        <h3 className="text-lg font-bold text-white mb-1">{video.title}</h3>
        <p className="text-sm text-white/60 mb-3">{video.description}</p>
        <p className="text-xs text-white/40 mb-4">
          Por <span className="text-white/70">{video.author}</span> ·{" "}
          {new Date(video.created_at).toLocaleDateString("es-AR")}
        </p>

        <div className="flex gap-2">
          <button
            onClick={loadExtras}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] text-white/80 hover:bg-white/[0.1] transition-colors text-sm font-medium"
          >
            <MessageCircle className="size-4" />
            {expanded ? "Ocultar" : "Ver feedback"}
            {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>
          {!analysis && (
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-500/15 text-purple-300 border border-purple-500/20 hover:bg-purple-500/25 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {analyzing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Sparkles className="size-4" />
              )}
              Analizar con IA
            </button>
          )}
        </div>

        {expanded && (
          <div className="mt-5 pt-5 border-t border-white/[0.06] space-y-5">
            {analysis && (
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.06] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="size-4 text-purple-300" />
                  <span className="text-sm font-semibold text-purple-300">Análisis de IA</span>
                  <span className="text-xs text-white/40 ml-auto">
                    Técnica {analysis.technical_score}/100 · Performance {analysis.performance_score}/100
                  </span>
                </div>
                <p className="text-sm text-white/70 mb-3 whitespace-pre-line">
                  {analysis.analysis_text}
                </p>
                {analysis.strengths?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-green-400 mb-1">Fortalezas</p>
                    <ul className="text-xs text-white/60 list-disc list-inside space-y-0.5">
                      {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {analysis.suggestions?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-amber-400 mb-1">Sugerencias</p>
                    <ul className="text-xs text-white/60 list-disc list-inside space-y-0.5">
                      {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-white/80 mb-3">
                Feedback de otros magos {comments && comments.length > 0 ? `(${comments.length})` : ""}
              </p>

              {loadingComments ? (
                <p className="text-sm text-white/40">Cargando...</p>
              ) : (
                <div className="space-y-3 mb-4">
                  {comments && comments.length === 0 && (
                    <p className="text-sm text-white/40">Todavía no hay comentarios. ¡Sé el primero!</p>
                  )}
                  {comments?.map((c) => (
                    <div key={c.id} className="rounded-xl bg-white/[0.04] p-3">
                      <p className="text-sm text-white/80">{c.content}</p>
                      <p className="text-xs text-white/40 mt-1">
                        {c.author} · {new Date(c.created_at).toLocaleDateString("es-AR")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {profile ? (
                <div className="flex gap-2">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Dejá tu feedback técnico..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500/40"
                    onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  />
                  <button
                    onClick={submitComment}
                    disabled={posting}
                    className="px-3 py-2 rounded-xl bg-amber-600 text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
                  >
                    <Send className="size-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm text-white/40">
                  <a href="/login" className="text-amber-400 hover:underline">Iniciá sesión</a> para dejar feedback.
                </p>
              )}
              {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
