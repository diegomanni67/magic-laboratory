"use client"

// VERSIÓN LOCAL ABIERTA - SIN LOGIN REQUERIDO

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Wand2,
  Sparkles,
  Eye,
  Hand,
  Target,
  ArrowRight,
  Star,
  Users,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const onlineAvatars = [
  { initials: "MR", bg: "bg-[oklch(0.72_0.22_350)]" },
  { initials: "KL", bg: "bg-[oklch(0.75_0.18_55)]" },
  { initials: "JW", bg: "bg-[oklch(0.72_0.19_220)]" },
  { initials: "TS", bg: "bg-[oklch(0.7_0.2_170)]" },
]

interface HeroCardProps {
  title: string
  tagline: string
  description: string
  levels: string
  features: { icon: React.ElementType; label: string }[]
  memberCount: string
  activeNow: number
  imageSrc: string
  icon: React.ElementType
  variant: "fundamentos" | "maestria"
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
  onClick?: () => void
}

function HeroCard({
  title,
  tagline,
  description,
  levels,
  features,
  memberCount,
  activeNow,
  imageSrc,
  icon: Icon,
  variant,
  isHovered,
  onHover,
  onLeave,
  onClick,
}: HeroCardProps) {
  const isFundamentos = variant === "fundamentos"

  return (
    <button
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl text-left transition-all duration-500 ease-out",
        "bg-white/[0.03] border border-white/[0.08]",
        isHovered
          ? "scale-[1.02] border-white/[0.15]"
          : ""
      )}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >


      {/* Image section */}
      <div className="relative h-32 overflow-hidden sm:h-36">
        <Image
          src={imageSrc}
          alt={`${title} - social learning`}
          fill
          className={cn(
            "object-cover transition-all duration-700 ease-out",
            isHovered ? "scale-110 brightness-105" : "scale-100"
          )}
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
        />
        {/* Gradient fade to glass */}
        <div className="absolute inset-0 bg-gradient-to-t from-[oklch(1_0_0/0.9)] via-[oklch(1_0_0/0.3)] to-transparent" />


        {/* Floating level badge */}
        <div className="absolute left-4 top-4">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white border",
              isFundamentos
                ? "bg-blue-500/20 border-blue-500/30"
                : "bg-pink-500/20 border-pink-500/30"
            )}
          >
            <Icon className="size-3" />
            {levels}
          </span>
        </div>

      </div>

      {/* Content */}
      <div className="relative flex flex-1 flex-col gap-2.5 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <div
                className={cn(
                  "flex size-10 items-center justify-center rounded-2xl transition-all duration-500",
                  isFundamentos
                    ? "bg-gradient-to-br from-[oklch(0.72_0.19_220)] to-[oklch(0.65_0.2_250)]"
                    : "bg-gradient-to-br from-[oklch(0.72_0.22_350)] to-[oklch(0.65_0.22_20)]"
                )}
              >
                <Icon className="size-5 text-[oklch(0.99_0_0)]" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold tracking-tight text-white sm:text-2xl text-balance">
                  {title}
                </h3>
                <p
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-[0.2em] text-white/50"
                  )}
                >
                  {tagline}
                </p>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-xl transition-all duration-500",
              isHovered
                ? isFundamentos
                  ? "bg-blue-500 text-white"
                  : "bg-pink-500 text-white"
                : "bg-slate-700 text-slate-300"
            )}
          >
            <ArrowRight
              className={cn(
                "size-4 transition-transform duration-300",
                isHovered && "translate-x-0.5"
              )}
            />
          </div>
        </div>

        <p className="text-sm leading-relaxed text-slate-200">
          {description}
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-1.5">
          {features.map((feature) => (
            <span
              key={feature.label}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-medium bg-white/[0.05] text-white/70 border border-white/[0.08]"
              )}
            >
              <feature.icon
                className={cn(
                  "size-3 shrink-0 text-white/50"
                )}
              />
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

  const handleCardClick = async (destination: string) => {
    // VERSIÓN LOCAL ABIERTA - ACCESO DIRECTO
    router.push(destination)
  }

  return (
    <div className="grid gap-4 sm:gap-5 sm:grid-cols-2">
      <HeroCard
        title="Fundamentos"
        tagline="Tu Base Técnica"
        description="Desarrolla los fundamentos del ilusionismo. Aprende manipulación básica, control de audiencia y principios esenciales."
        levels="Principiante"
        features={[
          { icon: Hand, label: "Manipulación" },
          { icon: Eye, label: "Atención" },
          { icon: Wand2, label: "Técnica" },
          { icon: Sparkles, label: "Diario" },
        ]}
        memberCount="2.4k"
        activeNow={142}
        imageSrc="/images/academy-social.jpg"
        icon={Wand2}
        variant="fundamentos"
        isHovered={hoveredCard === "fundamentos"}
        onHover={() => setHoveredCard("fundamentos")}
        onLeave={() => setHoveredCard(null)}
        onClick={() => handleCardClick('/fundamentos-forum')}
      />
      <HeroCard
        title="Maestría"
        tagline="El Salón Profesional"
        description="Ilusionistas avanzados perfeccionan su arte. Creación de efectos originales, análisis de performances y desafíos reales."
        levels="Avanzado"
        features={[
          { icon: Target, label: "Precisión" },
          { icon: Star, label: "Creatividad" },
          { icon: Sparkles, label: "Producción" },
          { icon: Users, label: "Análisis" },
        ]}
        memberCount="1.8k"
        activeNow={89}
        imageSrc="/images/studio-social.jpg"
        icon={Sparkles}
        variant="maestria"
        isHovered={hoveredCard === "maestria"}
        onHover={() => setHoveredCard("maestria")}
        onLeave={() => setHoveredCard(null)}
        onClick={() => handleCardClick('/maestria-forum')}
      />
    </div>
  )
}
