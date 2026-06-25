"use client"

// VERSIÓN LOCAL ABIERTA - SIN LOGIN REQUERIDO

import { useState } from "react"
import { fundamentosForumStorage, maestriaForumStorage } from "@/lib/forum-storage"
import { X, Send, Tag } from "lucide-react"

interface CreateThreadFormProps {
  categoryId: string
  categoryName: string
  onBack: () => void
  onThreadCreated: (threadId: string) => void
  forumType?: 'fundamentos' | 'maestria'
}

export function CreateThreadForm({ categoryId, categoryName, onBack, onThreadCreated, forumType = 'fundamentos' }: CreateThreadFormProps) {
  const forumStorage = forumType === 'fundamentos' ? fundamentosForumStorage : maestriaForumStorage
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // VERSIÓN LOCAL ABIERTA - SIN VERIFICACIÓN DE SESIÓN

    if (!title.trim() || !content.trim()) {
      setError("El título y el contenido son obligatorios")
      return
    }

    setIsSubmitting(true)
    setError("")

    try {
      const newThread = await forumStorage.saveThread({
        title: title.trim(),
        content: content.trim(),
        author: "Usuario Invitado", // VERSIÓN LOCAL ABIERTA
        authorEmail: "invitado@koterie.local",
        authorRole: "Student",
        category: categoryId,
        pinned: false,
        tags: tags
      })

      onThreadCreated(newThread.id)
    } catch (err) {
      setError("Error al crear el hilo. Inténtalo de nuevo.")
      setIsSubmitting(false)
    }
  }

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault()
      const newTag = tagInput.trim().toLowerCase()
      if (!tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag])
        setTagInput("")
      }
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <span className="flex items-center gap-2">
              <span>Back to {categoryName}</span>
            </span>
          </button>

          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Crear Nuevo Hilo
          </h1>
          <p className="text-gray-400">
            Comparte tus ideas, dudas o experiencias con la comunidad
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Título del Hilo *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escribe un título claro y descriptivo..."
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-purple-500/50 focus:outline-none transition-all duration-300 placeholder-gray-500"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/100 caracteres
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-gray-300 mb-2">
                Contenido *
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Describe tu idea, pregunta o experiencia en detalle..."
                rows={8}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-purple-500/50 focus:outline-none transition-all duration-300 placeholder-gray-500 resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {content.length}/2000 caracteres
              </p>
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-2">
                Etiquetas (máximo 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-purple-500/20 text-purple-300 text-sm rounded-full flex items-center gap-2"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-purple-400 hover:text-purple-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Agrega etiquetas y presiona Enter..."
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-purple-500/50 focus:outline-none transition-all duration-300 placeholder-gray-500"
                disabled={tags.length >= 5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Presiona Enter para agregar etiquetas. Máximo 5 etiquetas.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onBack}
                className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !content.trim()}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Publicar Hilo
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
