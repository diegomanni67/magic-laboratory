"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  FlaskConical,
  ScrollText,
  Archive,
  Users,
  MessageCircle,
  Sparkles,
  BookOpen,
  Lightbulb,
  Star,
  ArrowRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface HeroCardProps {
  title: string
  tagline: string
  description: string
  features: { icon: React.ElementType; label: string }[]
  icon: React.ElementType
  gradientFrom: string
  gradientTo: string
  accentText: string
  accentBg: string
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  onClick?: () => void
}

function HeroCard({
  title,
  tagline,
  description,
  features,
  icon: Icon,
  gradientFrom,
  gradientTo,
  accentText,
  accentBg,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: HeroCardProps) {
  return (
    <button
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-500 ease-out",
        "bg-white/[0.03] border border-white/[0.08]",
        isHovered ? "scale-[1.02] border-white/[0.15]" : ""
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {/* Gradient banner with icon, instead of a photo */}
      <div
        className={cn(
          "relative h-28 overflow-hidden sm:h-32 bg-gradient-to-br flex items-center justify-center",
          gradientFrom,
          gradientTo
        )}
      >
        <Icon
          className={cn(
            "size-14 text-white/25 transition-transform duration-700 ease-out",
            isHovered ? "scale-110 -rotate-3" : ""
          )}
        />
      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br",
                gradientFrom,
                gradientTo
              )}
            >
              <Icon className="size-5 text-white" />
            </div>
            <div>
              <h3 className="font-serif text-xl font-bold tracking-tight text-white sm:text-2xl text-balance">
                {title}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50">
                {tagline}
              </p>
            </div>
          </div>
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-500",
              isHovered ? cn(accentBg, accentText) : "bg-slate-700 text-slate-300"
            )}
          >
            <ArrowRight className={cn("size-4 transition-transform duration-300", isHovered && "translate-x-0.5")} />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-200">{description}</p>

        <div className="flex flex-wrap gap-1.5">
          {features.map((feature) => (
            <span
              key={feature.label}
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.05] text-white/70 border border-white/[0.08]"
            >
              <feature.icon className="size-3 shrink-0 text-white/50" />
              {feature.label}
            </span>
          ))}
        </div>
      </div>
    </button>
  )
}

export function HeroCards() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const router = useRouter()

  const handleCardClick = (destination: string) => {
    router.push(destination)
  }

  return (
    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <HeroCard
        title="Laboratorio"
        tagline="Taller de Técnica y Mejora"
        description="Subí tu material, recibí feedback de otros magos y, si querés, un análisis técnico con IA. Para perfeccionar tu arte en comunidad."
        features={[
          { icon: Users, label: "Compartir" },
          { icon: MessageCircle, label: "Feedback" },
          { icon: Sparkles, label: "IA opcional" },
        ]}
        icon={FlaskConical}
        gradientFrom="from-amber-500"
        gradientTo="to-orange-600"
        accentText="text-white"
        accentBg="bg-amber-500"
        isHovered={hoveredCard === "laboratorio"}
        onHover={() => setHoveredCard("laboratorio")}
        onLeave={() => setHoveredCard(null)}
        onClick={() => handleCardClick("/laboratorio")}
      />
      <HeroCard
        title="Crónicas"
        tagline="Relatos y Experiencias"
        description="Anécdotas, reseñas de lugares donde trabajaste, consejos para otros magos. Las historias que hacen a la logia."
        features={[
          { icon: BookOpen, label: "Anécdotas" },
          { icon: Star, label: "Reseñas" },
          { icon: Lightbulb, label: "Consejos" },
        ]}
        icon={ScrollText}
        gradientFrom="from-blue-500"
        gradientTo="to-indigo-600"
        accentText="text-white"
        accentBg="bg-blue-500"
        isHovered={hoveredCard === "cronicas"}
        onHover={() => setHoveredCard("cronicas")}
        onLeave={() => setHoveredCard(null)}
        onClick={() => handleCardClick("/cronicas")}
      />
      <HeroCard
        title="Archivo Maestro"
        tagline="Curaduría de Excelencia"
        description="Lo mejor de la logia, seleccionado a mano: técnicas, materiales y relatos que vale la pena no perderse."
        features={[
          { icon: Sparkles, label: "Curado a mano" },
          { icon: Archive, label: "Lo mejor" },
        ]}
        icon={Archive}
        gradientFrom="from-purple-500"
        gradientTo="to-fuchsia-600"
        accentText="text-white"
        accentBg="bg-purple-500"
        isHovered={hoveredCard === "archivo"}
        onHover={() => setHoveredCard("archivo")}
        onLeave={() => setHoveredCard(null)}
        onClick={() => handleCardClick("/archivo-maestro")}
      />
    </div>
  )
}
