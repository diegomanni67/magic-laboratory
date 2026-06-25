"use client"

// VERSIÓN LOCAL ABIERTA - SIN LOGIN REQUERIDO

import { useState, useEffect } from "react"
import { fundamentosForumStorage, maestriaForumStorage, ForumThread, ForumReply } from "@/lib/forum-storage"
import { ArrowLeft, MessageCircle, Heart, Clock, User, Send, Pin, Reply, ChevronDown, ChevronUp } from "lucide-react"
import { ReplyComponent } from "./ReplyComponent"
import { initializeDemoData, fundamentosDemoReplies, maestriaDemoReplies } from "@/lib/forum-demo-data"

interface ThreadDetailProps {
  threadId: string
  onBack: () => void
  categoryName?: string
  forumType?: 'fundamentos' | 'maestria'
}

export function ThreadDetail({ threadId, onBack, categoryName, forumType = 'fundamentos' }: ThreadDetailProps) {
  const forumStorage = forumType === 'fundamentos' ? fundamentosForumStorage : maestriaForumStorage
  const demoReplies = forumType === 'fundamentos' ? fundamentosDemoReplies : maestriaDemoReplies
  const [thread, setThread] = useState<ForumThread | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [replyContent, setReplyContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Initialize demo data if localStorage is empty
    initializeDemoData(forumType)

    const loadThread = async () => {
      try {
        const threadData = await forumStorage.getThread(threadId)
        if (threadData) {
          setThread(threadData)
          let threadReplies = await forumStorage.getReplies(threadId)
          console.log('Loaded replies for thread:', threadId, threadReplies.length)

          // If no replies in localStorage for this thread, use demo data directly
          if (threadReplies.length === 0) {
            const threadDemoReplies = demoReplies.filter((reply: ForumReply) => reply.threadId === threadId)
            console.log('Using demo replies for thread:', threadId, threadDemoReplies.length)
            threadReplies = threadDemoReplies
          }

          setReplies(threadReplies)
        }
      } catch (error) {
        console.error('Error loading thread:', error)
      }
    }

    loadThread()
  }, [threadId, forumType])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VERSIÓN LOCAL ABIERTA - SIN VERIFICACIÓN DE SESIÓN

    if (!replyContent.trim()) {
      setError("El contenido de la respuesta es obligatorio")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const newReply = await forumStorage.saveReply({
        threadId,
        content: replyContent.trim(),
        author: "Usuario Invitado", // VERSIÓN LOCAL ABIERTA
        authorEmail: "invitado@koterie.local",
        authorRole: "Student",
        parentId: replyingTo || undefined
      })

      setReplies([...replies, newReply])
      setReplyContent("")
      setReplyingTo(null)
      
      // Update thread reply count
      if (thread) {
        setThread({
          ...thread,
          replies: thread.replies + 1,
          updatedAt: new Date()
        })
      }
    } catch (err) {
      setError("Error al enviar respuesta. Inténtalo de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleExpanded = (replyId: string) => {
    const newExpanded = new Set(expandedReplies)
    if (newExpanded.has(replyId)) {
      newExpanded.delete(replyId)
    } else {
      newExpanded.add(replyId)
    }
    setExpandedReplies(newExpanded)
  }

  const getNestedReplies = (parentId: string) => {
    return replies.filter(reply => reply.parentId === parentId)
  }

  const getTopLevelReplies = () => {
    return replies.filter(reply => !reply.parentId)
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffInMs = now.getTime() - date.getTime()
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays > 0) {
      return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`
    } else if (diffInHours > 0) {
      return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`
    } else {
      return "Hace unos minutos"
    }
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-400">Cargando hilo...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <nav className="mb-6 flex items-center gap-2 text-sm">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Categorías</span>
          </button>
          <span className="text-gray-600">/</span>
          {categoryName && (
            <>
              <span className="text-purple-400">{categoryName}</span>
              <span className="text-gray-600">/</span>
            </>
          )}
          <span className="text-gray-400">Hilo</span>
        </nav>

        {/* Thread Title Header */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 mb-8">
          <div className="flex items-center gap-3 mb-6">
            {thread.pinned && (
              <div className="flex items-center gap-1 bg-yellow-500/20 px-3 py-1 rounded-full">
                <Pin className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">Fijado</span>
              </div>
            )}
          </div>
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            {thread.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">{thread.author.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <span className="font-medium text-purple-400">{thread.author}</span>
                <span className="text-gray-600 ml-1">({thread.authorRole})</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTimeAgo(thread.createdAt)}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                <span>{thread.replies} respuesta{thread.replies !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>{thread.views} vista{thread.views !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {thread.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full border border-purple-500/30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Original Post Content */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10 mb-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-white/10">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xl font-bold">{thread.author.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <span className="font-semibold text-white text-lg">{thread.author}</span>
                <span className="text-sm text-gray-500">({thread.authorRole})</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{formatTimeAgo(thread.createdAt)}</span>
                <span className="text-purple-400 font-medium">• Autor del hilo</span>
              </div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-xl">
              {thread.content}
            </p>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <span className="text-gray-500 text-sm font-medium">RESPUESTAS</span>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
        </div>

        {/* Reply Form - Always Visible - VERSIÓN LOCAL ABIERTA */}
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 mb-8">
            {replyingTo && (
              <div className="mb-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-purple-300">
                  <Reply className="w-4 h-4" />
                  <span>Respondiendo a un comentario</span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-white mb-4">
              {replyingTo ? "Escribe tu respuesta" : "Participa en la discusión"}
            </h3>
            
            <form onSubmit={handleReply} className="space-y-4">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={replyingTo ? "Escribe tu respuesta al comentario..." : "Comparte tu opinión sobre este tema..."}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-purple-500/50 focus:outline-none transition-all duration-300 placeholder-gray-500 resize-none"
                maxLength={1000}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">
                  {replyContent.length}/1000 caracteres
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting || !replyContent.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      {replyingTo ? "Responder" : "Publicar"}
                    </>
                  )}
                </button>
              </div>
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                  {error}
                </div>
              )}
            </form>
          </div>

        {/* Replies Section */}
        <div className="space-y-6">
          {replies.length === 0 ? (
            <div className="text-center py-12 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-gray-400 mb-2">
                Sé el primero en participar
              </h4>
              <p className="text-gray-500">
                Comparte tu opinión y ayuda a construir una comunidad activa
              </p>
            </div>
          ) : (
            <>
              <h3 className="text-2xl font-bold text-white mb-6">
                {replies.length} respuesta{replies.length !== 1 ? 's' : ''}
              </h3>
              <div className="space-y-6">
                {getTopLevelReplies().map((reply) => (
                  <ReplyComponent
                    key={reply.id}
                    reply={reply}
                    threadId={threadId}
                    session={undefined} // VERSIÓN LOCAL ABIERTA
                    onReply={setReplyingTo}
                    nestedReplies={getNestedReplies(reply.id)}
                    expandedReplies={expandedReplies}
                    onToggleExpanded={toggleExpanded}
                    formatTimeAgo={formatTimeAgo}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
