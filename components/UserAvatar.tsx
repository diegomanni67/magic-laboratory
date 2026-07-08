import Link from "next/link"

interface UserAvatarProps {
  avatarUrl?: string | null
  name?: string | null
  artisticName?: string | null
  userId: string
  size?: "sm" | "md" | "lg"
  showName?: boolean
  className?: string
}

export default function UserAvatar({
  avatarUrl,
  name,
  artisticName,
  userId,
  size = "md",
  showName = true,
  className = ""
}: UserAvatarProps) {
  const displayName = artisticName || name || "Mago"
  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const sizeClasses = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-12 text-base"
  }

  return (
    <Link
      href={`/profile/${userId}`}
      className={`flex items-center gap-2 hover:opacity-80 transition-opacity ${className}`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-full border-2 border-purple-500/30 ${
          avatarUrl ? "overflow-hidden" : "bg-gradient-to-br from-purple-500 to-pink-500"
        } ${sizeClasses[size]}`}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="size-full object-cover"
          />
        ) : (
          <span className="font-bold text-white">{initials}</span>
        )}
      </div>
      {showName && (
        <span className="font-medium text-white/90 text-sm">{displayName}</span>
      )}
    </Link>
  )
}
