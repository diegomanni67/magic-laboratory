"use client"

import { useState } from "react"
import { Upload, X, Video, Wand2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VideoUploadFormProps {
  onVideoUploaded: (videoData: {
    title: string
    description: string
    videoUrl: string
    techniqueCategory: string
    difficultyLevel: string
    tags: string[]
  }) => void
  onCancel: () => void
}

const techniqueCategories = [
  "Manipulación de Cartas",
  "Monedas",
  "Mentalismo",
  "Ilusionismo de Escenario",
  "Magia Cercana",
  "Escapología",
  "Levitación",
  "Transformación"
]

const difficultyLevels = [
  "Principiante",
  "Intermedio",
  "Avanzado",
  "Maestro"
]

export function VideoUploadForm({ onVideoUploaded, onCancel }: VideoUploadFormProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [techniqueCategory, setTechniqueCategory] = useState("")
  const [difficultyLevel, setDifficultyLevel] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState("")
  const [isDragging, setIsDragging] = useState(false)

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (file.type.startsWith('video/')) {
        // En una implementación real, aquí subiríamos el archivo a un servicio de almacenamiento
        // Por ahora, simulamos con una URL local
        const simulatedUrl = URL.createObjectURL(file)
        setVideoUrl(simulatedUrl)
      } else {
        setError("Por favor sube un archivo de video válido")
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !description.trim() || !videoUrl.trim() || !techniqueCategory || !difficultyLevel) {
      setError("Todos los campos son obligatorios")
      return
    }

    setIsUploading(true)
    setError("")

    try {
      // Simular subida del video
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      onVideoUploaded({
        title: title.trim(),
        description: description.trim(),
        videoUrl: videoUrl.trim(),
        techniqueCategory,
        difficultyLevel,
        tags
      })
    } catch (err) {
      setError("Error al subir el video. Inténtalo de nuevo.")
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onCancel}
            className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <span className="flex items-center gap-2">
              <X className="w-4 h-4" />
              <span>Cancelar</span>
            </span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Subir Práctica
              </h1>
              <p className="text-gray-400">
                Comparte tu ejecución para recibir análisis técnico
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 border border-white/10">
            {/* Video Upload Area */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Video de Práctica *
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                  "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300",
                  isDragging
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-white/20 hover:border-white/40 bg-white/5"
                )}
              >
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const simulatedUrl = URL.createObjectURL(file)
                      setVideoUrl(simulatedUrl)
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Video className={cn(
                  "w-12 h-12 mx-auto mb-4 transition-colors",
                  isDragging ? "text-amber-400" : "text-gray-400"
                )} />
                <p className="text-gray-300 mb-2">
                  Arrastra tu video aquí o haz clic para seleccionar
                </p>
                <p className="text-xs text-gray-500">
                  Formatos aceptados: MP4, WebM, MOV (máx. 500MB)
                </p>
              </div>
              
              {videoUrl && (
                <div className="mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <Video className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-green-300">Video seleccionado correctamente</span>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Título de la Práctica *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Double Lift - Práctica #45"
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all duration-300 placeholder-gray-500"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {title.length}/100 caracteres
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Descripción Técnica *
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe la técnica que estás practicando, los objetivos de esta ejecución y cualquier aspecto específico que quieras que analicemos..."
                rows={6}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all duration-300 placeholder-gray-500 resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {description.length}/2000 caracteres
              </p>
            </div>

            {/* Technique Category */}
            <div className="mb-6">
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Categoría de Técnica *
              </label>
              <select
                id="category"
                value={techniqueCategory}
                onChange={(e) => setTechniqueCategory(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all duration-300 text-gray-300"
              >
                <option value="">Selecciona una categoría</option>
                {techniqueCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Difficulty Level */}
            <div className="mb-6">
              <label htmlFor="difficulty" className="block text-sm font-medium text-gray-300 mb-2">
                Nivel de Dificultad *
              </label>
              <select
                id="difficulty"
                value={difficultyLevel}
                onChange={(e) => setDifficultyLevel(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all duration-300 text-gray-300"
              >
                <option value="">Selecciona el nivel</option>
                {difficultyLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
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
                    className="px-3 py-1 bg-amber-500/20 text-amber-300 text-sm rounded-full flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-amber-400 hover:text-amber-300"
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
                className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm rounded-lg border border-white/10 focus:border-amber-500/50 focus:outline-none transition-all duration-300 placeholder-gray-500"
                disabled={tags.length >= 5}
              />
              <p className="text-xs text-gray-500 mt-1">
                Presiona Enter para agregar etiquetas. Máximo 5 etiquetas.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isUploading || !title.trim() || !description.trim() || !videoUrl.trim() || !techniqueCategory || !difficultyLevel}
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Subiendo...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span>Subir Práctica</span>
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
