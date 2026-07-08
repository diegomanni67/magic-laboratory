import Image from "next/image"

// Genera un color de fondo consistente basado en el nombre del usuario
function getAvatarColor(name: string): string {
  const colors = [
    "from-amber-500 to-orange-600",
    "from-purple-500 to-pink-600",
    "from-emerald-500 to-teal-600",
    "from-blue-500 to-indigo-600",
    "from-rose-500 to-red-600",
    "from-fuchsia-500 to-purple-600",
    "from-cyan-500 to-blue-600",
    "from-lime-500 to-green-600",
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

type Size = "xs" | "sm" | "md" | "lg" | "xl"

const sizeClasses: Record<Size, string> = {
  xs: "size-7 text-xs",
  sm: "size-9 text-sm",
  md: "size-11 text-base",
  lg: "size-14 text-xl",
  xl: "size-20 text-3xl",
}

interface UserAvatarProps {
  name: string
  avatarUrl?: string | null
  size?: Size
  className?: string
}

export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const initial = (name || "?").charAt(0).toUpperCase()
  const colorGradient = getAvatarColor(name || "?")
  const sizeClass = sizeClasses[size]

  if (avatarUrl) {
    return (
      <div
        className={`relative shrink-0 overflow-hidden rounded-full ${sizeClass} ${className}`}
      >
        <Image
          src={avatarUrl}
          alt={name}
          fill
          className="object-cover"
          unoptimized // las URLs de Supabase Storage no necesitan optimización de Next
        />
      </div>
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${colorGradient} ${sizeClass} ${className}`}
    >
      {initial}
    </div>
  )
}
