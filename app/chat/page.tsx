"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Send, Hash, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

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
  }
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadRooms()
    loadUser()
  }, [])

  useEffect(() => {
    if (selectedRoom) {
      loadMessages(selectedRoom.id)
      setupRealtimeSubscription(selectedRoom.id)
    }
  }, [selectedRoom])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadUser = async () => {
    try {
      const supabase = createClient()
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
    } catch (error) {
      console.error("Error loading user:", error)
    }
  }

  const loadRooms = async () => {
    try {
      const res = await fetch("/api/chat-rooms")
      const data = await res.json()
      setRooms(data.rooms || [])
      if (data.rooms && data.rooms.length > 0) {
        setSelectedRoom(data.rooms[0])
      }
    } catch (error) {
      console.error("Error loading rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (roomId: string) => {
    try {
      const res = await fetch(`/api/chat-messages?room_id=${roomId}`)
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error("Error loading messages:", error)
    }
  }

  const setupRealtimeSubscription = (roomId: string) => {
    const supabase = createClient()
    
    const channel = supabase
      .channel(`chat_messages:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedRoom || !user) return

    setSending(true)
    try {
      const res = await fetch("/api/chat-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_id: selectedRoom.id,
          message: newMessage.trim()
        })
      })

      if (!res.ok) {
        const data = await res.json()
        alert(data.error || "Error al enviar mensaje")
        return
      }

      setNewMessage("")
    } catch (error) {
      alert("Error al enviar mensaje")
    } finally {
      setSending(false)
    }
  }

  const getDisplayName = (msg: ChatMessage) => {
    return msg.users.artistic_name || msg.users.name || "Mago"
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center text-white/70">
        Cargando chat...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#121826]">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-white/50 hover:text-white">
            <ArrowLeft className="size-5" />
          </Link>
          <div className="flex items-center gap-3">
            <Hash className="size-5 text-purple-400" />
            <h1 className="text-xl font-semibold">Chat del Laboratorio</h1>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Rooms */}
        <aside className="w-64 border-r border-white/10 bg-[#121826] flex-shrink-0">
          <div className="p-4">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-white/50">
              <Users className="size-4" />
              Canales
            </h2>
            <div className="space-y-1">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    selectedRoom?.id === room.id
                      ? "bg-purple-600/20 text-purple-300"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Hash className="size-4" />
                  <span className="font-medium">{room.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex flex-1 flex-col">
          {/* Room Header */}
          {selectedRoom && (
            <div className="border-b border-white/10 bg-[#121826]/50 px-6 py-4">
              <div className="flex items-center gap-3">
                <Hash className="size-5 text-purple-400" />
                <div>
                  <h2 className="text-lg font-semibold">{selectedRoom.name}</h2>
                  {selectedRoom.description && (
                    <p className="text-sm text-white/50">{selectedRoom.description}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {!selectedRoom ? (
              <div className="flex h-full items-center justify-center text-white/40">
                Seleccioná un canal para comenzar
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-white/40">
                <div className="text-center">
                  <Hash className="mx-auto mb-2 size-8" />
                  <p>No hay mensajes en este canal</p>
                  <p className="text-sm mt-1">¡Sé el primero en saludar!</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isOwnMessage = msg.user_id === user?.id
                const avatarClass = isOwnMessage
                  ? "bg-gradient-to-br from-purple-500 to-pink-500"
                  : "bg-gradient-to-br from-amber-500 to-orange-500"
                const messageContainerClass = isOwnMessage
                  ? "bg-purple-600/30 border border-purple-500/30"
                  : "bg-white/5 border border-white/10"
                const alignmentClass = isOwnMessage ? "items-end" : "items-start"
                const flexDirectionClass = isOwnMessage ? "flex-row-reverse" : ""

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${flexDirectionClass}`}
                  >
                    <div className={`flex size-10 items-center justify-center rounded-full ${avatarClass} text-lg font-bold`}>
                      {getDisplayName(msg).charAt(0).toUpperCase()}
                    </div>
                    <div className={`flex flex-col max-w-[70%] ${alignmentClass}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-white">
                          {getDisplayName(msg)}
                        </span>
                        <span className="text-xs text-white/40">{formatTime(msg.created_at)}</span>
                      </div>
                      <div className={`rounded-2xl px-4 py-2 ${messageContainerClass}`}>
                        <p className="text-sm text-white/90">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {selectedRoom && user && (
            <div className="border-t border-white/10 bg-[#121826]/50 p-4">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribí un mensaje..."
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 outline-none focus:border-purple-500/50"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="size-4" />
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </form>
            </div>
          )}

          {!user && selectedRoom && (
            <div className="border-t border-white/10 bg-[#121826]/50 p-4 text-center text-white/50">
              <Link href="/login" className="text-purple-400 hover:text-purple-300">
                Iniciá sesión
              </Link>
              {" "}para enviar mensajes
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
