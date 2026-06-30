"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Users, 
  Search, 
  ArrowLeft,
  Sparkles
} from "lucide-react"
import { mockStudents, getCurrentUserInterests } from "@/lib/mock-data"

// Intereses del usuario actual para filtro "Mis gustos"
const currentUserInterests = getCurrentUserInterests()

export default function CommunityPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeFilter, setActiveFilter] = useState("all")
  const [connections, setConnections] = useState<string[]>([])

  const filteredStudents = mockStudents.filter(student => {
    const allInterests = [...student.interesesGenerales, ...student.interesesEspecificos]
    const matchesSearch = student.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         allInterests.some(interest => 
                           interest.toLowerCase().includes(searchTerm.toLowerCase())
                         )
    
    let matchesFilter = true
    if (activeFilter === "academy") {
      matchesFilter = student.rango.includes("Academy")
    } else if (activeFilter === "studio") {
      matchesFilter = student.rango.includes("Studio")
    } else if (activeFilter === "my-tastes") {
      matchesFilter = allInterests.some(interest => 
        currentUserInterests.includes(interest)
      )
    }
    
    return matchesSearch && matchesFilter
  })

  const handleViewProfile = (studentId: string) => {
    router.push(`/profile/${studentId}`)
  }

  const handleConnect = (studentId: string) => {
    setConnections(prev => [...prev, studentId])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-6">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Comunidad</h1>
                    <p className="text-sm text-gray-500">{mockStudents.length} miembros</p>
                  </div>
                  <Link
                    href="/laboratorio"
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Laboratorio</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 w-4 h-4 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre o interés..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeFilter === "all"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setActiveFilter("academy")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeFilter === "academy"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Academy
              </button>
              <button
                onClick={() => setActiveFilter("studio")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeFilter === "studio"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Studio
              </button>
              <button
                onClick={() => setActiveFilter("my-tastes")}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeFilter === "my-tastes"
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Mis gustos
              </button>
            </div>

            <div className="text-sm text-gray-500">
              {filteredStudents.length} resultados
            </div>
          </div>
        </div>
      </div>

      {/* Members Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No se encontraron miembros
            </h3>
            <p className="text-sm text-gray-500">
              Intenta ajustar los filtros de búsqueda
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredStudents.map((student) => (
              <div key={student.id} className="bg-white p-6 rounded-2xl border border-gray-200">
                {/* Avatar */}
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">{student.nombre.charAt(0)}</span>
                </div>

                {/* Name and Rank */}
                <h3 className="font-bold text-gray-900 text-center mb-1">{student.nombre}</h3>
                <p className="text-sm text-gray-500 text-center mb-4">{student.rango} {student.nivel}</p>

                {/* Interests */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[...student.interesesGenerales, ...student.interesesEspecificos].slice(0, 3).map((interest, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                  {[...student.interesesGenerales, ...student.interesesEspecificos].length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      +{[...student.interesesGenerales, ...student.interesesEspecificos].length - 3}
                    </span>
                  )}
                </div>

                {/* Location */}
                <p className="text-xs text-gray-400 text-center mb-4">{student.ubicacion}</p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href={`/profile/${student.id}`}
                    className="flex-1 px-3 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors text-center"
                  >
                    Ver Perfil
                  </Link>
                  <button
                    onClick={() => handleConnect(student.id)}
                    disabled={connections.includes(student.id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      connections.includes(student.id)
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {connections.includes(student.id) ? "Conectado" : "Conectar"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}