"use client"

import { useState } from "react"
import { Video, Calendar, Clock, Users, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface PracticeScheduleProps {
  practiceDay?: string
  practiceTime?: string
  practiceType?: 'zoom' | 'meet' | 'teams'
  mentorName?: string
  practiceLevel?: string
  isJoining?: boolean
}

export function PracticeSchedule({ 
  practiceDay = "Martes",
  practiceTime = "19:00",
  practiceType = 'zoom',
  mentorName = "Maestro Alejandro",
  practiceLevel = "Fundamentos Intermedio",
  isJoining = false
}: PracticeScheduleProps) {
  const [isJoiningPractice, setIsJoiningPractice] = useState(false)

  const handleJoinPractice = () => {
    setIsJoiningPractice(true)
    // Simular redirección a la sesión de práctica
    setTimeout(() => {
      setIsJoiningPractice(false)
      window.open('#', '_blank')
    }, 1500)
  }

  const getPlatformInfo = () => {
    switch (practiceType) {
      case 'zoom':
        return {
          name: 'Zoom',
          icon: 'video',
          color: 'from-blue-600 to-blue-400',
          bgColor: 'bg-blue-600/20 border-blue-600/30'
        }
      case 'meet':
        return {
          name: 'Google Meet',
          icon: 'video',
          color: 'from-green-600 to-green-400',
          bgColor: 'bg-green-600/20 border-green-600/30'
        }
      case 'teams':
        return {
          name: 'Microsoft Teams',
          icon: 'video',
          color: 'from-purple-600 to-purple-400',
          bgColor: 'bg-purple-600/20 border-purple-600/30'
        }
      default:
        return {
          name: 'Zoom',
          icon: 'video',
          color: 'from-blue-600 to-blue-400',
          bgColor: 'bg-blue-600/20 border-blue-600/30'
        }
    }
  }

  const platformInfo = getPlatformInfo()

  return (
    <div className="rounded-3xl glass border border-border/50 p-6 bg-gradient-to-br from-[oklch(0.12_0.02_250)] to-[oklch(0.15_0.03_260)]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-[oklch(0.95_0.01_250)]">Mi Sesión Semanal</h3>
        <div className={cn(
          "px-3 py-1 rounded-full text-xs font-medium border",
          platformInfo.bgColor,
          "text-white"
        )}>
          {platformInfo.name}
        </div>
      </div>

      <div className="space-y-4">
        {/* Practice Info Card */}
        <div className="p-4 rounded-2xl bg-[oklch(0.1_0.02_250)] border border-[oklch(0.2_0.03_250)]">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-gradient-to-br from-[oklch(0.72_0.19_220)] to-[oklch(0.65_0.2_250)] flex items-center justify-center">
              <Video className="size-5 text-[oklch(0.99_0_0)]" />
            </div>
            <div>
              <h4 className="font-semibold text-[oklch(0.85_0.01_250)]">Sesión de Práctica</h4>
              <p className="text-sm text-[oklch(0.6_0.01_250)]">{practiceLevel}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-[oklch(0.6_0.01_250)]" />
              <span className="text-[oklch(0.7_0.01_250)]">{practiceDay}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-[oklch(0.6_0.01_250)]" />
              <span className="text-[oklch(0.7_0.01_250)]">{practiceTime} hs</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-[oklch(0.2_0.03_250)]">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-[oklch(0.6_0.01_250)]" />
              <span className="text-sm text-[oklch(0.7_0.01_250)]">Mentor: {mentorName}</span>
            </div>
          </div>
        </div>

        {/* Practice Status */}
        <div className="p-4 rounded-2xl bg-[oklch(0.1_0.02_250)] border border-[oklch(0.2_0.03_250)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[oklch(0.7_0.01_250)]">Estado</span>
            <div className="flex items-center gap-1">
              <div className="size-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400">Programada</span>
            </div>
          </div>
          <p className="text-xs text-[oklch(0.5_0.01_250)]">
            Tu sesión está programada y lista para comenzar
          </p>
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoinPractice}
          disabled={isJoiningPractice}
          className={cn(
            "w-full flex items-center justify-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
            isJoiningPractice 
              ? "bg-green-600/20 text-green-400 cursor-not-allowed"
              : "bg-gradient-to-r from-[oklch(0.72_0.19_220)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] text-[oklch(0.99_0_0)] hover:shadow-[0_8px_30px_oklch(0.72_0.19_220/0.4)] hover:scale-[1.02]"
          )}
        >
          {isJoiningPractice ? (
            <>
              <div className="size-5 animate-spin rounded-full border-2 border-[oklch(0.99_0_0)] border-t-transparent" />
              <span>Uniéndose a la sesión...</span>
            </>
          ) : (
            <>
              <Video className="size-5" />
              <span>Unirse a la Sesión</span>
              <ExternalLink className="size-4" />
            </>
          )}
        </button>

        {/* Additional Info */}
        <div className="text-xs text-[oklch(0.5_0.01_250)] space-y-1">
          <p>La sesión comenzará 5 minutos antes de la hora programada</p>
          <p>Asegúrate de tener cámara y micrófono funcionando</p>
          <p>El enlace se activará 15 minutos antes de la sesión</p>
        </div>
      </div>
    </div>
  )
}
