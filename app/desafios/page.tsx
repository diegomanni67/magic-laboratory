"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Play,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Timer,
  Video,
  X,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { UserAvatar } from "@/components/profile/UserAvatar"

type Challenge = {
  id: string
  title: string
  description: string
  start_date: string
  end_date: string
}

type Submission = {
  id: string
  video_url: string
  created_at: string
  user_id: string
  users: {
    id: string
    name: string | null
    artistic_name: string | null
    avatar_url: string | null
  }
  challenge_votes: { count: number }[]
}

function getDisplayName(user: { name?: string | null; artistic_name?: string | null } | null) {
  return user?.artistic_name || user?.name || "Mago"
}

function getVideoEmbedUrl(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  if (url.match(/\.(mp4|webm|ogg)$/i)) return url
  return null
}

export default function DesafiosPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, total: 0 })

  const getTimeRemaining = (endDate: string) => {
    const total = Date.parse(endDate) - Date.now()
    return {
      days: Math.floor(total / (1000 * 60 * 60 * 24)),
      hours: Math.floor((total / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((total / 1000 / 60) % 60),
      total,
    }
  }

  const loadSubmissions = async (challengeId: string) => {
    const res = await fetch(`/api/challenge-submissions?challenge_id=${challengeId}`)
    const data = await res.json()
    return data.submissions || []
  }

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setUserId(user?.id ?? null)

        const challengeRes = await fetch("/api/challenges")
        const challengeData = await challengeRes.json()
        setChallenge(challengeData.challenge)

        if (challengeData.challenge) {
          const subs = await loadSubmissions(challengeData.challenge.id)
          setSubmissions(subs)

          if (user) {
            setHasSubmitted(subs.some((s: Submission) => s.user_id === user.id))

            const bookmarkRes = await fetch(`/api/bookmarks?challenge_id=${challengeData.challenge.id}`)
            const bookmarkData = await bookmarkRes.json()
            setIsBookmarked(bookmarkData.bookmarked)

            const votes = await Promise.all(
              subs.map(async (s: Submission) => {
                const res = await fetch(`/api/challenge-votes?submission_id=${s.id}`)
                const d = await res.json()
                return { id: s.id, voted: d.voted }
              })
            )
            setUserVotes(new Set(votes.filter((v) => v.voted).map((v) => v.id)))
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (!challenge) return
    const timer = setInterval(() => setTimeRemaining(getTimeRemaining(challenge.end_date)), 1000)
    setTimeRemaining(getTimeRemaining(challenge.end_date))
    return () => clearInterval(timer)
  }, [challenge])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge || !videoUrl.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/challenge-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challenge.id, video_url: videoUrl.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al enviar"); return }
      toast.success("¡Video enviado correctamente! ✨")
      setShowModal(false)
      setVideoUrl("")
      setHasSubmitted(true)
      setSubmissions(await loadSubmissions(challenge.id))
    } catch { toast.error("Error al enviar el video") }
    finally { setSubmitting(false) }
  }

  const handleVote = async (submissionId: string) => {
    if (!userId) { toast.error("Iniciá sesión para votar"); return }
    try {
      const res = await fetch("/api/challenge-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error al votar"); return }
      setUserVotes((prev) => {
        const next = new Set(prev)
        data.voted ? next.add(submissionId) : next.delete(submissionId)
        return next
      })
      toast.success(data.voted ? "¡Voto registrado! ✨" : "Voto eliminado")
      if (challenge) setSubmissions(await loadSubmissions(challenge.id))
    } catch { toast.error("Error al votar") }
  }

  const handleBookmark = async () => {
    if (!userId || !challenge) { toast.error("Iniciá sesión para guardar"); return }
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge_id: challenge.id }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || "Error"); return }
      setIsBookmarked(data.bookmarked)
      toast.success(data.bookmarked ? "Desafío guardado 📌" : "Eliminado de guardados")
    } catch { toast.error("Error al guardar") }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e] text-white/70">
        Cargando desafío...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="size-4" /> Volver al inicio
        </Link>

        {!challenge ? (
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
            <div className="text-6xl">🔮</div>
            <h2 className="text-2xl font-semibold text-purple-300">Próximo desafío preparándose...</h2>
            <p className="text-white/50">Volvé pronto para ver el nuevo desafío semanal</p>
          </div>
        ) : (
          <>
            {/* Header del desafío */}
            <div className="mb-12 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-indigo-900/10 p-8 shadow-2xl shadow-purple-900/20">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="mb-4 flex items-center gap-3">
                    <Sparkles className="size-6 text-purple-400" />
                    <span className="text-sm font-semibold uppercase tracking-wider text-purple-300">
                      Desafío Semanal
                    </span>
                  </div>
                  <h1 className="mb-4 bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-4xl font-bold text-transparent">
                    {challenge.title}
                  </h1>
                  <p className="mb-6 text-lg text-white/70">{challenge.description}</p>

                  {timeRemaining.total > 0 ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-6 py-4">
                      <Timer className="size-5 text-purple-300" />
                      <div className="flex gap-6">
                        {[
                          { val: timeRemaining.days, label: "días" },
                          { val: timeRemaining.hours, label: "horas" },
                          { val: timeRemaining.minutes, label: "minutos" },
                        ].map(({ val, label }) => (
                          <div key={label} className="text-center">
                            <div className="text-2xl font-bold text-purple-300">{val}</div>
                            <div className="text-xs text-white/50">{label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-6 py-4 text-amber-300">
                      El desafío ha finalizado
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {userId && (
                    <button
                      onClick={handleBookmark}
                      className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold transition whitespace-nowrap ${
                        isBookmarked
                          ? "border border-purple-500/50 bg-purple-600/20 text-purple-300"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/30"
                      }`}
                    >
                      {isBookmarked ? <BookmarkCheck className="size-5" /> : <Bookmark className="size-5" />}
                      {isBookmarked ? "Guardado" : "Guardar"}
                    </button>
                  )}
                  {userId && !hasSubmitted && timeRemaining.total > 0 && (
                    <button
                      onClick={() => setShowModal(true)}
                      className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold shadow-lg shadow-purple-900/30 transition hover:opacity-90 whitespace-nowrap"
                    >
                      <Video className="size-5" /> Participar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Participaciones */}
            <div>
              <h2 className="mb-6 flex items-center gap-3 text-2xl font-semibold">
                <Play className="size-6 text-purple-400" />
                Participaciones ({submissions.length})
              </h2>

              {submissions.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-white/40">
                  <Video className="mx-auto mb-4 size-12" />
                  <p>Aún no hay participaciones. ¡Sé el primero en mostrar tu magia!</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {submissions.map((submission) => {
                    const embedUrl = getVideoEmbedUrl(submission.video_url)
                    const displayName = getDisplayName(submission.users)
                    const voteCount = submission.challenge_votes[0]?.count || 0
                    const hasVoted = userVotes.has(submission.id)

                    return (
                      <div
                        key={submission.id}
                        className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/20"
                      >
                        <div className="aspect-video bg-black">
                          {embedUrl ? (
                            embedUrl.startsWith("http") ? (
                              <iframe
                                src={embedUrl}
                                className="h-full w-full"
                                allowFullScreen
                                title={`Video de ${displayName}`}
                              />
                            ) : (
                              <video src={embedUrl} controls className="h-full w-full" />
                            )
                          ) : (
                            <div className="flex h-full items-center justify-center text-white/30">
                              Video no compatible
                            </div>
                          )}
                        </div>

                        <div className="p-5">
                          {/* Autor con avatar */}
                          <Link
                            href={`/profile/${submission.user_id}`}
                            className="mb-4 flex items-center gap-3 hover:opacity-80 transition"
                          >
                            <UserAvatar
                              name={displayName}
                              avatarUrl={submission.users.avatar_url}
                              size="sm"
                            />
                            <div>
                              <p className="font-semibold text-white hover:text-amber-300 transition-colors">
                                {displayName}
                              </p>
                              <p className="text-xs text-white/40">
                                {new Date(submission.created_at).toLocaleDateString("es-AR")}
                              </p>
                            </div>
                          </Link>

                          <button
                            onClick={() => handleVote(submission.id)}
                            disabled={!userId}
                            className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 font-medium transition ${
                              hasVoted
                                ? "border border-purple-500/50 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                            } disabled:cursor-not-allowed disabled:opacity-50`}
                          >
                            {hasVoted ? <ThumbsDown className="size-4" /> : <ThumbsUp className="size-4" />}
                            {hasVoted ? "Quitar voto" : "Votar ✨"}
                            <span className="ml-auto font-bold">{voteCount}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modal participar */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/90 to-indigo-900/90 p-6 shadow-2xl shadow-purple-900/50">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Participar en el Desafío</h3>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-full p-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/70">URL del Video</label>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
                  required
                />
                <p className="mt-2 text-xs text-white/40">Acepta YouTube, Vimeo o videos directos</p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 font-medium hover:bg-white/10"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3 font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? "Enviando..." : "Enviar Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
