"use client"

import { useState, useRef, useEffect } from "react"
import { Send, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  text: string
  sender: "user" | "other"
  timestamp: Date
}

interface MemberChatProps {
  memberName: string
  mentorName: string
  isCommunityChat?: boolean
}

export function MemberChat({ 
  memberName, 
  mentorName, 
  isCommunityChat = false 
}: MemberChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isTyping, setIsTyping] = useState(false)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Mensaje de bienvenida automático
    const welcomeMessage: Message = {
      id: "1",
      text: isCommunityChat 
        ? `¡Hola! Soy ${memberName}. ¿Cómo estás?`
        : `¡Hola ${memberName}! Soy ${mentorName}, tu mentor. ¿En qué puedo ayudarte hoy?`,
      sender: "other",
      timestamp: new Date()
    }
    setMessages([welcomeMessage])
  }, [memberName, mentorName, isCommunityChat])

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: "user",
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, userMessage])
      setNewMessage("")
      
      // Simular respuesta
      setIsTyping(true)
      setTimeout(() => {
        const responseMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: isCommunityChat 
            ? `¡Qué bueno! Me encanta esa idea. ¿Quieres que practiquemos juntos?`
            : `Entendido ${memberName}. Estoy aquí para ayudarte con lo que necesites.`,
          sender: "other",
          timestamp: new Date()
        }
        setMessages(prev => [...prev, responseMessage])
        setIsTyping(false)
      }, 1500)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {isCommunityChat ? `Chat con ${memberName}` : "Chat con Mentor"}
            </h3>
            <p className="text-sm text-gray-500">
              {isCommunityChat ? "Miembro" : "Mentor de ilusionismo"}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.sender === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-xs px-4 py-2 rounded-2xl",
                message.sender === "user"
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-900"
              )}
            >
              <p className="text-sm">{message.text}</p>
              <p className={cn(
                "text-xs mt-1",
                message.sender === "user" ? "text-amber-200" : "text-gray-500"
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 max-w-xs px-4 py-2 rounded-2xl">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Escribe tu mensaje..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
