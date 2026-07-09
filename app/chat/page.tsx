'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';

const supabase = createClient();

interface ChatRoom {
  id: string;
  name: string;
  description: string;
}

interface Message {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    artistic_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function ChatPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string>('cartomagia');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initChat() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: dbRooms } = await supabase
        .from('chat_rooms')
        .select('*');
      
      if (dbRooms) setRooms(dbRooms);
      setLoading(false);
    }
    initChat();
  }, []);

  useEffect(() => {
    async function loadMessages() {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          id,
          room_id,
          user_id,
          message,
          created_at,
          profiles:user_id (
            full_name,
            artistic_name,
            avatar_url
          )
        `)
        .eq('room_id', activeRoom)
        .order('created_at', { ascending: true });

      if (data) {
        setMessages(data as any);
      }
    }

    loadMessages();

    const channel = supabase
      .channel(`public:chat_messages:room_id=eq.${activeRoom}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `room_id=eq.${activeRoom}`,
        },
        async (payload: any) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, artistic_name, avatar_url')
            .eq('id', payload.new.user_id)
            .single();

          const messageWithProfile: Message = {
            ...payload.new,
            profiles: profile || null,
          };

          setMessages((prev) => [...prev, messageWithProfile]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const messageText = newMessage;
    setNewMessage('');

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          room_id: activeRoom,
          user_id: user.id,
          message: messageText,
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error enviando mensaje:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Canalizando la señal en vivo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex text-white">
      
      <div className="w-64 bg-slate-900 border-r border-slate-800/80 p-4 hidden md:flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400 mb-2">
            🔮 Laboratorio En Vivo
          </h2>
          <p className="text-xs text-slate-500">Charlá con otros ilusionistas conectados en tiempo real.</p>
        </div>

        <div className="flex-1 flex flex-col gap-1 overflow-y-auto">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-semibold transition text-sm ${
                activeRoom === room.id
                  ? 'bg-purple-900/40 border border-purple-500/30 text-purple-200'
                  : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col h-screen">
        
        <div className="p-4 bg-slate-900 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-200">
              {rooms.find((r) => r.id === activeRoom)?.name || 'Cargando sala...'}
            </h3>
            <p className="text-xs text-slate-500 hidden sm:block">
              {rooms.find((r) => r.id === activeRoom)?.description}
            </p>
          </div>
          
          <select 
            value={activeRoom} 
            onChange={(e) => setActiveRoom(e.target.value)}
            className="md:hidden bg-slate-950 text-purple-300 border border-purple-500/20 rounded-xl px-3 py-1.5 text-xs font-semibold"
          >
            {rooms.map((room) => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
              <span className="text-4xl">🃏</span>
              <p className="text-sm">Silencio en la sala... ¡Comenzá vos la charla!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const creatorName = msg.profiles?.artistic_name || msg.profiles?.full_name || 'Mago Anónimo';
              const avatarUrl = msg.profiles?.avatar_url || null;

              return (
                <div 
                  key={msg.id} 
                  className="flex items-start gap-3 hover:bg-slate-900/20 p-2 rounded-xl transition duration-150"
                >
                  <UserAvatar 
                    avatarUrl={avatarUrl} 
                    fullName={creatorName} 
                    size={40} 
                    className="border-purple-500/20 ring-1 ring-purple-500/10"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-bold text-purple-300">
                        {creatorName}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1 break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800/80">
          {user ? (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribí tu truco o pregunta al chat en vivo..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition duration-200 text-sm shadow-md"
              >
                Enviar 🔮
              </button>
            </form>
          ) : (
            <p className="text-sm text-center text-slate-500 py-2">
              Debés iniciar sesión para participar de la charla en vivo.
            </p>
          )}
        </div>

      </div>

    </div>
  );
}