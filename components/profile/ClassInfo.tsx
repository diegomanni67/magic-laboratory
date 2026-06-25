"use client"

import { useState } from "react"
import { Video, Calendar, Clock, User, CheckCircle, AlertCircle, Phone } from "lucide-react"
import { cn } from "@/lib/utils"

interface PracticeInfoProps {
  evaluationStatus?: 'pending' | 'scheduled' | 'completed'
  practiceDay?: string
  practiceTime?: string
  practiceLink?: string
  mentorName?: string
  practiceName?: string
}

export function PracticeInfo({ 
  evaluationStatus = 'pending',
  practiceDay = "Martes",
  practiceTime = "19:00",
  practiceLink = "",
  mentorName = "Maestro Alejandro",
  practiceName = "Fundamentos Intermedio"
}: PracticeInfoProps) {
  const [isJoining, setIsJoining] = useState(false)

  const handleJoinPractice = () => {
    setIsJoining(true)
    setTimeout(() => {
      setIsJoining(false)
      if (practiceLink) {
        window.open(practiceLink, '_blank')
      }
    }, 1500)
  }

  const handleContactMentor = () => {
    const message = "Hola! Soy aprendiz de Magic Laboratory y tengo una consulta sobre mi práctica."
    const whatsappUrl = `https://wa.me/5491123456789?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const getStatusContent = () => {
    switch (evaluationStatus) {
      case 'completed':
        return {
          icon: <CheckCircle className="size-5 text-green-400" />,
          title: "Evaluación Completada",
          subtitle: `Nivel asignado: ${practiceName}`,
          color: "from-green-600/20 to-emerald-600/20 border-green-600/30",
          textColor: "text-green-400",
          badge: "Completo"
        }
      case 'scheduled':
        return {
          icon: <Calendar className="size-5 text-blue-400" />,
          title: "Evaluación Agendada",
          subtitle: `${practiceDay} ${practiceTime} hs`,
          color: "from-blue-600/20 to-cyan-600/20 border-blue-600/30",
          textColor: "text-blue-400",
          badge: "Agendada"
        }
      default:
        return {
          icon: <AlertCircle className="size-5 text-yellow-400" />,
          title: "Evaluación Pendiente",
          subtitle: "Contacta a tu mentor",
          color: "from-yellow-600/20 to-orange-600/20 border-yellow-600/30",
          textColor: "text-yellow-400",
          badge: "Pendiente"
        }
    }
  }

  const statusContent = getStatusContent()

  return (
    <div className="space-y-4">
      {/* Leveling Status Card */}
      <div className={cn(
        "rounded-3xl glass border p-6 bg-gradient-to-br",
        statusContent.color
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-xl bg-[oklch(0.1_0.02_250)] flex items-center justify-center">
            {statusContent.icon}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[oklch(0.95_0.01_250)] mb-1">
              {statusContent.title}
            </h3>
            <p className={cn("text-sm", statusContent.textColor)}>
              {statusContent.subtitle}
            </p>
          </div>
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium border",
            statusContent.color,
            "text-white"
          )}>
            {statusContent.badge}
          </div>
        </div>

        {evaluationStatus === 'pending' && (
          <button
            onClick={handleContactMentor}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[oklch(0.72_0.18_55/0.2)] text-[oklch(0.72_0.18_55)] hover:bg-[oklch(0.72_0.18_55/0.3)] transition-colors"
          >
            <Phone className="size-4" />
            <span>Contactar Mentor</span>
          </button>
        )}
      </div>

      {/* Practice Schedule Card */}
      <div className="rounded-3xl glass border border-[oklch(0.2_0.03_250)] p-6 bg-gradient-to-br from-[oklch(0.12_0.02_250)] to-[oklch(0.15_0.03_260)]">
        <h3 className="font-bold text-[oklch(0.95_0_01_250)] mb-4">Sesión Semanal</h3>
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Calendar className="size-5 text-[oklch(0.6_0_01_250)]" />
            <div>
              <p className="text-sm text-[oklch(0.7_0_01_250)]">Día y hora</p>
              <p className="font-medium text-[oklch(0.85_0_01_250)]">{practiceDay} {practiceTime} hs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User className="size-5 text-[oklch(0.6_0_01_250)]" />
            <div>
              <p className="text-sm text-[oklch(0.7_0_01_250)]">Mentor</p>
              <p className="font-medium text-[oklch(0.85_0_01_250)]">{mentorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Video className="size-5 text-[oklch(0.6_0_01_250)]" />
            <div>
              <p className="text-sm text-[oklch(0.7_0_01_250)]">Modalidad</p>
              <p className="font-medium text-[oklch(0.85_0_01_250)]">Virtual (Zoom)</p>
            </div>
          </div>

          <div className="pt-4 border-t border-[oklch(0.2_0_03_250)]">
            <button
              onClick={handleJoinPractice}
              disabled={evaluationStatus !== 'completed' || !practiceLink}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl transition-all duration-300",
                (evaluationStatus === 'completed' && practiceLink)
                  ? "bg-gradient-to-r from-[oklch(0.72_0.18_55)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] text-[oklch(0.99_0_0)] hover:shadow-[0_8px_30px_oklch(0.72_0.18_55/0.4)] hover:scale-[1.02]"
                  : "bg-[oklch(0.2_0_03_250)] text-[oklch(0.5_0_01_250)] cursor-not-allowed"
              )}
            >
              {isJoining ? (
                <>
                  <div className="size-4 animate-spin rounded-full border-2 border-[oklch(0.99_0_0)] border-t-transparent" />
                  <span>Uniéndose...</span>
                </>
              ) : (
                <>
                  <Video className="size-4" />
                  <span>
                    {evaluationStatus === 'completed' ? "Unirse a la Sesión" : 
                     evaluationStatus === 'scheduled' ? "Espera la evaluación" : 
                     "Completa tu evaluación primero"}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="text-xs text-[oklch(0.5_0_01_250)] space-y-1">
            <p>La sesión comenzará 5 minutos antes de la hora programada</p>
            <p>Asegúrate de tener cámara y micrófono funcionando</p>
            <p>El enlace se activará 15 minutos antes de la sesión</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-3xl glass border border-[oklch(0.2_0_03_250)] p-4 bg-gradient-to-br from-[oklch(0.12_0_02_250)] to-[oklch(0.15_0_03_260)]">
        <h4 className="font-medium text-[oklch(0.85_0_01_250)] mb-3">Acciones Rápidas</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[oklch(0.1_0_02_250)] border border-[oklch(0.2_0_03_250)] text-[oklch(0.7_0_01_250)] hover:bg-[oklch(0.15_0_03_250)] transition-colors text-sm">
            <Calendar className="size-4" />
            <span>Agendar</span>
          </button>
          <button className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[oklch(0.1_0_02_250)] border border-[oklch(0.2_0_03_250)] text-[oklch(0.7_0_01_250)] hover:bg-[oklch(0.15_0_03_250)] transition-colors text-sm">
            <Phone className="size-4" />
            <span>Contactar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
