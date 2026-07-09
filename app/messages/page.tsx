"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export default function MessagesPage() {
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get("with") // El ID del vendedor obtenido de la URL

  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const initChat = async () => {
      if (!targetUserId) return
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      try {
        const res = await fetch(`/api/messages?with=${targetUserId}`)
        const data = await res.json()
        if (res.ok) setMessages(data.messages)
      } catch {
        console.error("Error cargando mensajes")
      } finally {
        setLoading(false)
      }
    }
    void initChat()
  }, [targetUserId])

  // Scroll automático abajo al recibir o enviar mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || !targetUserId) return

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiver_id: targetUserId, content: text }),
      })
      const data = await res.json()
      if (res.ok) {
        setMessages((prev) => [...prev, data.message])
        setText("")
      }
    } catch {
      console.error("Error enviando mensaje")
    }
  }

  if (!targetUserId) {
    return (
      <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center p-4">
        <p className="text-white/50 mb-4">Seleccioná un producto del marketplace para iniciar un chat privado.</p>
        <Link href="/marketplace" className="rounded-xl bg-white/5 border border-white/10 px-4 py-2 text-sm hover:bg-white/10">Volver al Marketplace</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col">
      {/* Header del Chat */}
      <header className="border-b border-white/10 bg-[#0e1626] px-4 py-4 flex items-center gap-4">
        <Link href="/marketplace" className="text-white/50 hover:text-white">
          <ArrowLeft className="size-5" />
        </Link>
        <div>
          <h1 className="text-md font-semibold">Conversación Privada</h1>
          <p className="text-xs text-emerald-400 font-medium">Canal seguro y directo</p>
        </div>
      </header>

      {/* Cuerpo del Chat */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3 max-w-4xl w-full mx-auto">
        {loading ? (
          <p className="text-center text-xs text-white/30 pt-10">Cargando mensajes del historial...</p>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-white/30 pt-10">Iniciá la conversación preguntando por la disponibilidad del producto.</p>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser?.id
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${isMe ? "bg-amber-600 text-white rounded-br-none" : "bg-white/10 text-white rounded-bl-none border border-white/5"}`}>
                  <p>{msg.content}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input de Mensajes */}
      <footer className="border-t border-white/10 bg-[#0e1626] p-4">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Escribí tu mensaje privado..." className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none focus:border-amber-500/50" />
          <button type="submit" className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 flex items-center justify-center font-semibold hover:opacity-90 transition-opacity">
            <Send className="size-4" />
          </button>
        </form>
      </footer>
    </div>
  )
}