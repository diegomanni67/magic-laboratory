"use client"

import { useState } from "react"
import { User, MapPin, Heart, MessageCircle, Eye } from "lucide-react"
import { cn } from "@/lib/utils"

interface MemberCardProps {
  member: {
    id: string
    name: string
    avatar?: string
    bio: string
    specialties: string[]
    level: string
    location?: string
    joinDate: string
  }
  currentUserId?: string
  onViewProfile?: (memberId: string) => void
  onConnect?: (memberId: string) => void
  onMessage?: (memberId: string) => void
  isOwnProfile?: boolean
}

export function MemberCard({ 
  member, 
  currentUserId,
  onViewProfile,
  onConnect,
  onMessage,
  isOwnProfile = false
}: MemberCardProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [showNotification, setShowNotification] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    setTimeout(() => {
      setIsConnecting(false)
      setShowNotification(true)
      onConnect?.(member.id)
      
      setTimeout(() => {
        setShowNotification(false)
      }, 3000)
    }, 1000)
  }

  const getSpecialtyIcon = (specialty: string) => {
    const icons: { [key: string]: string } = {
      'Manipulación de Cartas': 'cards',
      'Monedas': 'coins',
      'Mentalismo': 'brain',
      'Ilusionismo de Escenario': 'stage',
      'Magia Cercana': 'close-up',
      'Escapología': 'escape',
      'Levitación': 'float',
      'Transformación': 'transform',
      'Predicción': 'predict',
      'Telepatía': 'telepathy'
    }
    return icons[specialty] || 'wand'
  }

  return (
    <div className="relative">
      {/* Notification */}
      {showNotification && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium shadow-lg">
          ¡Conexión solicitada!
        </div>
      )}

      <div className="rounded-3xl glass border border-[oklch(0.2_0.03_250)] p-6 bg-gradient-to-br from-[oklch(0.12_0.02_250)] to-[oklch(0.15_0.03_260)] transition-all duration-300 hover:shadow-[0_8px_30px_oklch(0_0_0/0.12)] hover:border-[oklch(0.72_0.18_55/0.3)] hover:scale-[1.02]">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <div className="size-16 rounded-full bg-gradient-to-br from-[oklch(0.72_0.18_55)] to-[oklch(0.65_0.2_250)] flex items-center justify-center shadow-[0_4px_20px_oklch(0.72_0.18_55/0.3)]">
              {member.avatar ? (
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="size-full rounded-full object-cover"
                />
              ) : (
                <User className="size-8 text-[oklch(0.99_0_0)]" />
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 size-4 rounded-full bg-green-400 border-2 border-[oklch(0.12_0.02_250)]" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-[oklch(0.95_0.01_250)] text-lg mb-1">
              {member.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-[oklch(0.6_0.01_250)] mb-2">
              <span className="px-2 py-1 rounded-full bg-[oklch(0.72_0.18_55/0.2)] text-[oklch(0.72_0.18_55)] text-xs font-medium">
                {member.level}
              </span>
              {member.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="size-3" />
                  <span>{member.location}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-[oklch(0.7_0.01_250)] line-clamp-2">
              {member.bio}
            </p>
          </div>
        </div>

        {/* Specialties */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {member.specialties.slice(0, 4).map((specialty, index) => (
              <span 
                key={index}
                className="px-3 py-1 rounded-full bg-[oklch(0.72_0.22_350/0.2)] text-[oklch(0.72_0.22_350)] text-xs font-medium border border-[oklch(0.72_0.22_350/0.3)]"
              >
                {specialty}
              </span>
            ))}
            {member.specialties.length > 4 && (
              <span className="px-3 py-1 rounded-full bg-[oklch(0.2_0.03_250)] text-[oklch(0.6_0.01_250)] text-xs font-medium">
                +{member.specialties.length - 4} más
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewProfile?.(member.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[oklch(0.1_0.02_250)] border border-[oklch(0.2_0.03_250)] text-[oklch(0.7_0_01_250)] hover:bg-[oklch(0.15_0_03_250)] transition-colors text-sm font-medium"
          >
            <Eye className="size-4" />
            <span>Ver Perfil</span>
          </button>
          
          {!isOwnProfile && (
            <>
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300",
                  isConnecting
                    ? "bg-green-600/20 text-green-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-[oklch(0.72_0.18_55)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] text-[oklch(0.99_0_0)] hover:shadow-[0_4px_20px_oklch(0.72_0.18_55/0.4)] hover:scale-[1.05]"
                )}
              >
                {isConnecting ? (
                  <>
                    <div className="size-4 animate-spin rounded-full border-2 border-[oklch(0.99_0_0)] border-t-transparent" />
                    <span>Conectando...</span>
                  </>
                ) : (
                  <>
                    <Heart className="size-4" />
                    <span>Conectar</span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => onMessage?.(member.id)}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[oklch(0.1_0_02_250)] border border-[oklch(0.2_0_03_250)] text-[oklch(0.7_0_01_250)] hover:bg-[oklch(0.15_0_03_250)] transition-colors text-sm font-medium"
              >
                <MessageCircle className="size-4" />
                <span className="hidden sm:inline">Mensaje</span>
              </button>
            </>
          )}
        </div>

        {/* Match Indicator */}
        {!isOwnProfile && (
          <div className="mt-4 pt-4 border-t border-[oklch(0.2_0_03_250)]">
            <div className="flex items-center justify-center gap-2 text-xs text-[oklch(0.6_0_01_250)]">
              <div className="size-2 rounded-full bg-pink-400 animate-pulse" />
              <span>¡Comparten {Math.floor(Math.random() * 3) + 1} especialidades!</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
