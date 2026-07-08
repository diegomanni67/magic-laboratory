"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowLeft, Sparkles, Timer, Video, X, Play, ThumbsUp, ThumbsDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  }
  challenge_votes: { count: number }[]
}

export default function DesafiosPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [videoUrl, setVideoUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        setUser(currentUser)

        // Load active challenge
        const challengeRes = await fetch("/api/challenges")
        const challengeData = await challengeRes.json()
        setChallenge(challengeData.challenge)

        // Load submissions if challenge exists
        if (challengeData.challenge) {
          const submissionsRes = await fetch(`/api/challenge-submissions?challenge_id=${challengeData.challenge.id}`)
          const submissionsData = await submissionsRes.json()
          setSubmissions(submissionsData.submissions || [])

          // Check if current user has submitted
          if (currentUser) {
            const userSubmission = submissionsData.submissions?.find((s: Submission) => s.user_id === currentUser.id)
            setHasSubmitted(!!userSubmission)

            // Load user's votes
            const votePromises = submissionsData.submissions?.map(async (s: Submission) => {
              const voteRes = await fetch(`/api/challenge-votes?submission_id=${s.id}`)
              const voteData = await voteRes.json()
              return { submissionId: s.id, voted: voteData.voted }
            }) || []
            
            const votes = await Promise.all(votePromises)
            const votedSet = new Set(votes.filter((v: any) => v.voted).map((v: any) => v.submissionId))
            setUserVotes(votedSet)
          }
        }
      } catch (error) {
        console.error("Error loading data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge || !videoUrl.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch("/api/challenge-submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challenge_id: challenge.id,
          video_url: videoUrl.trim()
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === "Ya te has postulado a este desafío") {
          toast.error("Ya te has postulado a este desafío anteriormente")
        } else {
          toast.error(data.error || "Error al enviar el video")
        }
        return
      }

      toast.success("¡Video enviado correctamente! ✨")
      setShowModal(false)
      setVideoUrl("")
      setHasSubmitted(true)

      // Reload submissions
      const submissionsRes = await fetch(`/api/challenge-submissions?challenge_id=${challenge.id}`)
      const submissionsData = await submissionsRes.json()
      setSubmissions(submissionsData.submissions || [])
    } catch (error) {
      toast.error("Error al enviar el video")
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (submissionId: string) => {
    if (!user) {
      toast.error("Debes iniciar sesión para votar")
      return
    }

    try {
      const res = await fetch("/api/challenge-votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submission_id: submissionId })
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al votar")
        return
      }

      // Update local state
      if (data.voted) {
        setUserVotes(new Set([...userVotes, submissionId]))
        toast.success("¡Voto registrado! ✨")
      } else {
        setUserVotes(new Set([...userVotes].filter(id => id !== submissionId)))
        toast.success("Voto eliminado")
      }

      // Reload submissions to get updated vote counts
      if (challenge) {
        const submissionsRes = await fetch(`/api/challenge-submissions?challenge_id=${challenge.id}`)
        const submissionsData = await submissionsRes.json()
        setSubmissions(submissionsData.submissions || [])
      }
    } catch (error) {
      toast.error("Error al votar")
    }
  }

  const getVideoEmbedUrl = (url: string) => {
    // YouTube
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`
    }

    // Direct video URL
    if (url.match(/\.(mp4|webm|ogg)$/i)) {
      return url
    }

    return null
  }

  const getTimeRemaining = (endDate: string) => {
    const total = Date.parse(endDate) - Date.parse(new Date().toISOString())
    const days = Math.floor(total / (1000 * 60 * 60 * 24))
    const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((total / 1000 / 60) % 60)

    return { days, hours, minutes, total }
  }

  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0, total: 0 })

  useEffect(() => {
    if (challenge) {
      const timer = setInterval(() => {
        setTimeRemaining(getTimeRemaining(challenge.end_date))
      }, 1000)
      setTimeRemaining(getTimeRemaining(challenge.end_date))
      return () => clearInterval(timer)
    }
  }, [challenge])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white/70">
        Cargando desafío...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>

        {!challenge ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-6xl">🔮</div>
              <h2 className="text-2xl font-semibold text-purple-300 mb-2">
                Próximo desafío preparándose en el laboratorio...
              </h2>
              <p className="text-white/50">Volvé pronto para ver el nuevo desafío semanal</p>
            </div>
          </div>
        ) : (
          <>
            {/* Challenge Header */}
            <div className="mb-12 rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-indigo-900/10 p-8 shadow-2xl shadow-purple-900/20">
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="mb-4 flex items-center gap-3">
                    <Sparkles className="size-6 text-purple-400" />
                    <span className="text-sm font-semibold uppercase tracking-wider text-purple-300">
                      Desafío Semanal
                    </span>
                  </div>
                  <h1 className="mb-4 text-4xl font-bold bg-gradient-to-r from-purple-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">
                    {challenge.title}
                  </h1>
                  <p className="text-lg text-white/70 mb-6">{challenge.description}</p>
                  
                  {/* Countdown */}
                  {timeRemaining.total > 0 ? (
                    <div className="flex items-center gap-4 rounded-2xl border border-purple-500/20 bg-purple-500/10 px-6 py-4">
                      <Timer className="size-5 text-purple-300" />
                      <div className="flex gap-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-300">{timeRemaining.days}</div>
                          <div className="text-xs text-white/50">días</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-300">{timeRemaining.hours}</div>
                          <div className="text-xs text-white/50">horas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-300">{timeRemaining.minutes}</div>
                          <div className="text-xs text-white/50">minutos</div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-6 py-4 text-amber-300">
                      El desafío ha finalizado
                    </div>
                  )}
                </div>

                {user && !hasSubmitted && timeRemaining.total > 0 && (
                  <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold transition hover:opacity-90 shadow-lg shadow-purple-900/30 whitespace-nowrap"
                  >
                    <Video className="size-5" />
                    Participar en el Desafío
                  </button>
                )}
              </div>
            </div>

            {/* Submissions Grid */}
            <div>
              <h2 className="mb-6 text-2xl font-semibold flex items-center gap-3">
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
                    const displayName = submission.users.artistic_name || submission.users.name || "Mago"
                    const voteCount = submission.challenge_votes[0]?.count || 0
                    const hasVoted = userVotes.has(submission.id)

                    return (
                      <div
                        key={submission.id}
                        className="rounded-3xl border border-white/10 bg-white/5 overflow-hidden shadow-xl shadow-black/20"
                      >
                        {/* Video Embed */}
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
                              <video
                                src={embedUrl}
                                controls
                                className="h-full w-full"
                              />
                            )
                          ) : (
                            <div className="flex h-full items-center justify-center text-white/30">
                              Video no compatible
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="p-5">
                          <div className="mb-3">
                            <h3 className="font-semibold text-white">{displayName}</h3>
                            <p className="text-xs text-white/40">
                              {new Date(submission.created_at).toLocaleDateString("es-AR")}
                            </p>
                          </div>

                          {/* Vote Button */}
                          <button
                            onClick={() => handleVote(submission.id)}
                            disabled={!user}
                            className={`flex items-center justify-center gap-2 w-full rounded-2xl px-4 py-3 font-medium transition ${
                              hasVoted
                                ? "bg-purple-600/20 border border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
                                : "bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            {hasVoted ? (
                              <>
                                <ThumbsDown className="size-4" />
                                Quitar voto
                              </>
                            ) : (
                              <>
                                <ThumbsUp className="size-4" />
                                Votar ✨
                              </>
                            )}
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

      {/* Modal */}
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
                <label className="mb-2 block text-sm font-medium text-white/70">
                  URL del Video
                </label>
                <input
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=... o https://vimeo.com/..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
                  required
                />
                <p className="mt-2 text-xs text-white/40">
                  Acepta enlaces de YouTube, Vimeo o videos directos (mp4, webm)
                </p>
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
