"use client"

// VERSIÓN LOCAL ABIERTA - SIN LOGIN REQUERIDO

import { useState, useEffect } from "react"
import { fundamentosForumStorage, maestriaForumStorage, ForumThread } from "@/lib/forum-storage"
import { MessageCircle, Eye, Pin, Clock, Plus, Search } from "lucide-react"
import { initializeDemoData, fundamentosDemoThreads, maestriaDemoThreads } from "@/lib/forum-demo-data"

interface ForumThreadViewProps {
  categoryId: string
  categoryName: string
  onBack: () => void
  onThreadClick: (threadId: string) => void
  onCreateThread: () => void
  forumType?: 'fundamentos' | 'maestria'
}

export function ForumThreadView({ categoryId, categoryName, onBack, onThreadClick, onCreateThread, forumType = 'fundamentos' }: ForumThreadViewProps) {
  const forumStorage = forumType === 'fundamentos' ? fundamentosForumStorage : maestriaForumStorage
  const demoThreads = forumType === 'fundamentos' ? fundamentosDemoThreads : maestriaDemoThreads
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"latest" | "popular" | "views">("latest")

  useEffect(() => {
    // Initialize demo data if localStorage is empty
    initializeDemoData(forumType)

    const loadThreads = async () => {
      try {
        let categoryThreads = await forumStorage.getThreads(categoryId)
        console.log('Loaded threads for category:', categoryId, categoryThreads.length)

        // If no threads in localStorage for this category, use demo data directly
        if (categoryThreads.length === 0) {
          const categoryDemoThreads = demoThreads.filter(thread => thread.category === categoryId)
          console.log('Using demo threads for category:', categoryId, categoryDemoThreads.length)
          categoryThreads = categoryDemoThreads
        }

        let sortedThreads = [...categoryThreads]

        switch (sortBy) {
          case "latest":
            sortedThreads.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
            break
          case "popular":
            sortedThreads.sort((a, b) => b.replies - a.replies)
            break
          case "views":
            sortedThreads.sort((a, b) => b.views - a.views)
            break
        }

        if (searchTerm) {
          sortedThreads = sortedThreads.filter(thread =>
            thread.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            thread.content.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        setThreads(sortedThreads)
      } catch (error) {
        console.error('Error loading threads:', error)
        setThreads([])
      }
    }

    loadThreads()
  }, [categoryId, searchTerm, sortBy])

  const handleThreadClick = async (threadId: string) => {
    try {
      await forumStorage.updateThreadViews(threadId)
      onThreadClick(threadId)
    } catch (error) {
      console.error('Error updating thread views:', error)
      onThreadClick(threadId)
    }
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

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <span className="flex items-center gap-2">
              <span>Back to Categories</span>
            </span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {categoryName}
              </h1>
              <p className="text-gray-400">
                {threads.length} hilo{threads.length !== 1 ? 's' : ''} en esta categoría
              </p>
            </div>

            {/* VERSIÓN LOCAL ABIERTA - SIEMPRE MOSTRAR BOTÓN */}
            <button
              onClick={onCreateThread}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center gap-2 font-medium"
            >
              <Plus className="w-5 h-5" />
              Nuevo Hilo
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar hilos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 focus:border-purple-500/50 focus:outline-none transition-all duration-300"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "latest" | "popular" | "views")}
            className="px-4 py-3 bg-white/5 backdrop-blur-md rounded-lg border border-white/10 focus:border-purple-500/50 focus:outline-none transition-all duration-300"
          >
            <option value="latest">Más recientes</option>
            <option value="popular">Más populares</option>
            <option value="views">Más vistos</option>
          </select>
        </div>

        {/* Threads List */}
        <div className="space-y-4">
          {threads.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                No hay hilos en esta categoría
              </h3>
              <p className="text-gray-500 mb-6">
                Sé el primero en crear un hilo
              </p>
              <button
                onClick={onCreateThread}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
              >
                Crear Primer Hilo
              </button>
            </div>
          ) : (
            threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => handleThreadClick(thread.id)}
                className="w-full p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/20 text-left group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {thread.pinned && (
                        <Pin className="w-4 h-4 text-yellow-400" />
                      )}
                      <h3 className="text-lg font-semibold text-white group-hover:text-purple-400 transition-colors">
                        {thread.title}
                      </h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      {thread.content}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-purple-400">{thread.author}</span>
                        <span className="text-gray-600">({thread.authorRole})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTimeAgo(thread.updatedAt)}</span>
                      </div>
                      {thread.tags.length > 0 && (
                        <div className="flex gap-2">
                          {thread.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 text-sm">
                    <div className="flex items-center gap-3 text-gray-400">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{thread.replies}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{thread.views}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
