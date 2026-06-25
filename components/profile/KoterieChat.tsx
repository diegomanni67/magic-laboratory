"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Video, Calendar, Clock, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: 'apprentice' | 'mentor'
  timestamp: string
  senderName?: string
}

interface MagicLabChatProps {
  apprenticeName?: string
  mentorName?: string
}

export function MagicLabChat({ 
  apprenticeName = "Aprendiz", 
  mentorName = "Maestro Alejandro"
}: MagicLabChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "¡Hola! Bienvenido a Magic Laboratory. Soy tu mentor y estoy aquí para ayudarte en tu perfeccionamiento del ilusionismo.",
      sender: "mentor",
      timestamp: "10:00",
      senderName: mentorName
    },
    {
      id: "2", 
      text: "Hola mentor, mucho gusto. Estoy muy emocionado por empezar a perfeccionar mi arte.",
      sender: "apprentice",
      timestamp: "10:02",
      senderName: apprenticeName
    },
    {
      id: "3",
      text: "¡Excelente! La dedicación es clave. ¿Has practicado ilusionismo antes o es tu primera vez?",
      sender: "mentor", 
      timestamp: "10:03",
      senderName: mentorName
    },
    {
      id: "4",
      text: "He practicado un poco por mi cuenta, pero hace mucho tiempo que no lo hago. Quiero poder ejecutar con confianza.",
      sender: "apprentice",
      timestamp: "10:05",
      senderName: apprenticeName
    },
    {
      id: "5",
      text: "Perfecto. Con práctica constante y las técnicas correctas, vas a lograr ese objetivo. Nuestra primera sesión será para evaluar tu nivel actual y diseñar un plan personalizado.",
      sender: "mentor",
      timestamp: "10:06", 
      senderName: mentorName
    }
  ])
  
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg: Message = {
        id: Date.now().toString(),
        text: newMessage.trim(),
        sender: "apprentice",
        timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
        senderName: apprenticeName
      }
      
      setMessages(prev => [...prev, newMsg])
      setNewMessage("")
      
      // Simular respuesta del mentor
      setTimeout(() => {
        setIsTyping(true)
        setTimeout(() => {
          const mentorResponse: Message = {
            id: (Date.now() + 1).toString(),
            text: "Gracias por tu mensaje. Lo he recibido y te responderé pronto.",
            sender: "mentor",
            timestamp: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }),
            senderName: mentorName
          }
          setMessages(prev => [...prev, mentorResponse])
          setIsTyping(false)
        }, 2000)
      }, 500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="rounded-3xl glass border border-[oklch(0.2_0.03_250)] bg-gradient-to-br from-[oklch(0.12_0.02_250)] to-[oklch(0.15_0.03_260)] overflow-hidden">
      {/* Chat Header */}
      <div className="border-b border-[oklch(0.2_0.03_250)] p-4 bg-[oklch(0.1_0.02_250/0.8)]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="size-10 rounded-full bg-gradient-to-br from-[oklch(0.72_0.22_350)] to-[oklch(0.65_0.22_20)] flex items-center justify-center">
              <User className="size-5 text-[oklch(0.99_0_0)]" />
            </div>
            <div className="absolute -bottom-1 -right-1 size-3 rounded-full bg-green-400 border-2 border-[oklch(0.12_0.02_250)]" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-[oklch(0.95_0.01_250)]">{mentorName}</h4>
            <p className="text-xs text-[oklch(0.6_0.01_250)]">
              {isTyping ? "Escribiendo..." : "En línea"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-3",
              message.sender === "apprentice" ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div className={cn(
              "size-8 rounded-full flex items-center justify-center flex-shrink-0",
              message.sender === "apprentice" 
                ? "bg-gradient-to-br from-[oklch(0.72_0.18_55)] to-[oklch(0.65_0.2_250)]" 
                : "bg-gradient-to-br from-[oklch(0.72_0.22_350)] to-[oklch(0.65_0.22_20)]"
            )}>
              <span className="text-xs font-bold text-[oklch(0.99_0_0)]">
                {message.senderName?.charAt(0).toUpperCase()}
              </span>
            </div>
            
            <div className={cn(
              "max-w-[70%] space-y-1",
              message.sender === "apprentice" ? "items-end" : "items-start"
            )}>
              <div className={cn(
                "rounded-2xl px-4 py-2 text-sm",
                message.sender === "apprentice"
                  ? "bg-gradient-to-r from-[oklch(0.72_0.18_55)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] text-[oklch(0.99_0_0)] rounded-br-sm"
                  : "bg-[oklch(0.2_0.03_250)] text-[oklch(0.85_0.01_250)] rounded-bl-sm"
              )}>
                {message.text}
              </div>
              <div className={cn(
                "text-xs text-[oklch(0.5_0.01_250)]",
                message.sender === "apprentice" ? "text-right" : "text-left"
              )}>
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="size-8 rounded-full bg-gradient-to-br from-[oklch(0.72_0.22_350)] to-[oklch(0.65_0.22_20)] flex items-center justify-center">
              <span className="text-xs font-bold text-[oklch(0.99_0_0)]">P</span>
            </div>
            <div className="bg-[oklch(0.2_0.03_250)] rounded-2xl rounded-bl-sm px-4 py-2">
              <div className="flex gap-1">
                <div className="size-1.5 rounded-full bg-[oklch(0.6_0.01_250)] animate-bounce" />
                <div className="size-1.5 rounded-full bg-[oklch(0.6_0.01_250)] animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="size-1.5 rounded-full bg-[oklch(0.6_0.01_250)] animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[oklch(0.2_0.03_250)] p-4 bg-[oklch(0.1_0.02_250/0.8)]">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-2 rounded-2xl bg-[oklch(0.15_0.03_250)] border border-[oklch(0.25_0.04_250)] text-[oklch(0.85_0.01_250)] placeholder-[oklch(0.5_0_01_250)] focus:outline-none focus:border-[oklch(0.72_0.19_220)] focus:ring-2 focus:ring-[oklch(0.72_0.19_220/0.2)]"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className={cn(
              "flex items-center justify-center size-10 rounded-2xl transition-all duration-300",
              newMessage.trim()
                ? "bg-gradient-to-r from-[oklch(0.72_0.19_220)] via-[oklch(0.72_0.22_350)] to-[oklch(0.75_0.18_55)] text-[oklch(0.99_0_0)] hover:shadow-[0_4px_20px_oklch(0.72_0.19_220/0.4)] hover:scale-[1.05]"
                : "bg-[oklch(0.2_0_03_250)] text-[oklch(0.5_0_01_250)] cursor-not-allowed"
            )}
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
