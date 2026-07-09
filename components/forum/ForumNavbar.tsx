"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  TrendingUp,
  Search,
  Plus,
  Filter
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ForumNavbarProps {
  forumType: 'academy' | 'studio'
  title: string
  memberCount: string
  activeNow: number
}

export function ForumNavbar({ forumType, title, memberCount, activeNow }: ForumNavbarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const router = useRouter()

  const getForumColors = () => {
    return forumType === 'academy' 
      ? {
          primary: 'from-[oklch(0.72_0.19_220)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)]',
          accent: 'bg-blue-100 text-blue-800 border-blue-200'
        }
      : {
          primary: 'from-[oklch(0.72_0.22_350)] via-[oklch(0.75_0.18_55)] to-[oklch(0.72_0.19_220)]',
          accent: 'bg-purple-100 text-purple-800 border-purple-200'
        }
  }

  const colors = getForumColors()

  return (
    <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[oklch(0.72_0.19_220)] to-[oklch(0.65_0.2_250)] shadow-[0_4px_20px_oklch(0.72_0.19_220/0.3)]">
              <MessageSquare className="size-6 text-[oklch(0.99_0_0)]" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground">
                Espacio para estudiantes de niveles A1-A2
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar en el foro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 rounded-2xl border border-border/50 bg-background pl-10 pr-4 py-2 text-sm transition-all duration-300 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[oklch(0.72_0.19_220)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] px-4 py-2 text-sm font-bold text-[oklch(0.99_0_0)] shadow-[0_4px_20px_oklch(0.72_0.19_220/0.3)] transition-all duration-300 hover:shadow-[0_8px_30px_oklch(0.72_0.19_220/0.4)] hover:scale-[1.02]">
              <Plus className="size-4" />
              Crear nuevo post
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="border-b border-border/50 bg-secondary/20">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-100">
                <Users className="size-5 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{memberCount}</p>
                <p className="text-xs text-muted-foreground">Miembros</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-green-100">
                <MessageSquare className="size-5 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">Discusiones</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-purple-100">
                <TrendingUp className="size-5 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{activeNow}</p>
                <p className="text-xs text-muted-foreground">Activos hoy</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-orange-100">
                <Calendar className="size-5 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Próximo evento</p>
                <p className="text-xs text-muted-foreground">En 2 días</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
