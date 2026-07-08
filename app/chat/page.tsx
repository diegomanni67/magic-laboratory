"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Send, Hash, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { UserAvatar } from "@/components/profile/UserAvatar"

type ChatRoom = {
  id: string
  name: string
  description: string | null
}

type ChatMessage = {
  id: string
  message: string
  created_at: string
  user_id: string
  users: {
    id: string
    name: string | null
    artistic_name: string | null
    avatar_url: string | null
  } | null
}

type CurrentUser = {
  id: string
  name: string | null
  artistic_name: string | null
  avatar_url: string | null
}

function getDisplayName(user: { name?: string | null; artistic_name?: string | null } | null) {
  return user?.artistic_name || user?.name || "Mago"
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null)

  useEffect(() => {
    loadRooms()
    loadCurrentUser()
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id)
      setupRealtimeSubscription(selectedRoom.id)
    }
    return () => {
      if (channelRef.current) {
        createClient().removeChannel(channelRef.current)
      }
    }
  }, [selectedRoom])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const loadCurrentUser = async () => {
    try {
      const res = await fetch("/api/me")
      const data = await res.json()
      if (data.profile) {
        setCurrentUser({
          id: data.profile.id,
          name: data.profile.name,
          artistic_name: data.profile.artistic_name,
          avatar_url: data.profile.avatar_url ?? null,
        })
      }
    } catch {
      // no autenticado
    }
  }

  const loadRooms = async () => {
    try {
      const res = await fetch("/api/chat-rooms")
      const data = await res.json()
      setRooms(data.rooms || [])
      if (data.rooms?.length > 0) setSelectedRoom(data.rooms[0])
    } catch {
      console.error("Error cargando salas")
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat-messages?room_id=${roomId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch {
      console.error("Error cargando mensajes")
    }
  }

  const setupRealtimeSubscription = (roomId: string) => {
    if (channelRef.current) {
      createClient().removeChannel(channelRef.current)
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`chat_messages:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          // El payload de realtime no incluye el join de users —
          // hacemos un fetch del mensaje completo para tener el nombre y avatar.
          const res = await fetch(
            `/api/chat-messages?room_id=${roomId}&message_id=${payload.new.id}`
          )
          const data = await res.json()
          if (data.message) {
            setMessages((prev) => {
              // Evitar duplicados si el POST ya lo agregó
              if (prev.find((m) => m.id === data.message.id)) return prev
              return [...prev, data.message]
            })
          }
        }
      )
      .subscribe()

    channelRef.current = channel
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom || !currentUser) return

    setSending(true)

    // Optimistic update con el usuario actual
    const optimisticMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      message: newMessage.trim(),
      created_at: new Date().toISOString(),
      user_id: currentUser.id,
      users: {
        id: currentUser.id,
        name: currentUser.name,
        artistic_name: currentUser.artistic_name,
        avatar_url: currentUser.avatar_url,
      },
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setNewMessage("")

    try {
      const res = await fetch("/api/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          message: optimisticMsg.message,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Revertir optimistic update
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
        setNewMessage(optimisticMsg.message)
        alert(data.error || "Error al enviar mensaje")
        return
      }

      // Reemplazar el mensaje optimista con el real
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticMsg.id ? { ...data.message, users: optimisticMsg.users } : m))
      )
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id))
      setNewMessage(optimisticMsg.message)
      alert("Error al enviar mensaje")
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0f1e] text-white/70">
        Cargando chat...
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-[#0a0f1e] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#121826]">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4">
          <Link href="/" className="text-white/50 hover:text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Hash className="size-5 text-purple-400" />
            <h1 className="text-xl font-semibold">Chat del Laboratorio</h1>
          </div>
          {currentUser && (
            <div className="ml-auto flex items-center gap-2">
              <UserAvatar
                name={getDisplayName(currentUser)}
                avatarUrl={currentUser.avatar_url}
                size="sm"
              />
              <span className="text-sm text-white/60">{getDisplayName(currentUser)}</span>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Canales */}
        <aside className="w-56 shrink-0 border-r border-white/10 bg-[#121826]">
          <div className="p-4">
            <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/40">
              <Users className="size-3.5" />
              Canales
            </h2>
            <div className="space-y-1">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    selectedRoom?.id === room.id
                      ? "bg-purple-600/20 text-purple-300"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Hash className="size-3.5 shrink-0" />
                  <span className="font-medium">{room.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Área principal */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* Room header */}
          {selectedRoom && (
            <div className="border-b border-white/10 bg-[#121826]/50 px-6 py-3">
              <div className="flex items-center gap-2">
                <Hash className="size-4 text-purple-400" />
                <span className="font-semibold">{selectedRoom.name}</span>
                {selectedRoom.description && (
                  <span className="ml-2 text-sm text-white/40">{selectedRoom.description}</span>
                )}
              </div>
            </div>
          )}

          {/* Mensajes */}
          <div className="flex-1 space-y-1 overflow-y-auto px-4 py-4">
            {!selectedRoom ? (
              <div className="flex h-full items-center justify-center text-white/30">
                Seleccioná un canal
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-white/30">
                <Hash className="size-8" />
                <p>No hay mensajes. ¡Sé el primero!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isOwn = msg.user_id === currentUser?.id
                const senderName = getDisplayName(msg.users)
                const prevMsg = messages[i - 1]
                const isSameSender = prevMsg?.user_id === msg.user_id

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2.5 ${isOwn ? "flex-row-reverse" : ""} ${isSameSender ? "mt-0.5" : "mt-4"}`}
                  >
                    {/* Avatar — solo si es el primero de una secuencia */}
                    <div className="w-9 shrink-0">
                      {!isSameSender && (
                        <UserAvatar
                          name={senderName}
                          avatarUrl={msg.users?.avatar_url}
                          size="sm"
                        />
                      )}
                    </div>

                    <div className={`flex max-w-[70%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
                      {!isSameSender && (
                        <div className={`mb-1 flex items-center gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <Link
                            href={`/profile/${msg.user_id}`}
                            className="text-xs font-semibold text-white hover:text-amber-300 hover:underline"
                          >
                            {senderName}
                          </Link>
                          <span className="text-xs text-white/30">{formatTime(msg.created_at)}</span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm text-white/90 ${
                          isOwn
                            ? "rounded-br-sm bg-purple-600/40 border border-purple-500/30"
                            : "rounded-bl-sm bg-white/5 border border-white/10"
                        }`}
                      >
                        {msg.message}
                      </div>
                      {isSameSender && (
                        <span className="mt-0.5 text-xs text-white/20">{formatTime(msg.created_at)}</span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selectedRoom && (
            <div className="border-t border-white/10 bg-[#121826]/50 p-4">
              {currentUser ? (
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <UserAvatar
                    name={getDisplayName(currentUser)}
                    avatarUrl={currentUser.avatar_url}
                    size="sm"
                  />
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Mensaje en #${selectedRoom.name}...`}
                    className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
                    disabled={sending}
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-2.5 text-sm font-semibold transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="size-4" />
                    {sending ? "..." : "Enviar"}
                  </button>
                </form>
              ) : (
                <p className="text-center text-sm text-white/40">
                  <Link href="/login" className="text-purple-400 hover:underline">
                    Iniciá sesión
                  </Link>{" "}
                  para enviar mensajes
                </p>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
