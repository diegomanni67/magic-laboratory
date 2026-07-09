'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';

interface MemberProfile {
  id: string;
  full_name: string | null;
  artistic_name: string | null;
  bio: string | null;
  country: string | null;
  city: string | null;
  avatar_url: string | null;
  role?: string;
}

export default function CommunityPage() {
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadCommunity() {
      try {
        setLoading(true);
        
        // Consultar perfiles
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, artistic_name, bio, country, city, avatar_url')
          .order('full_name', { ascending: true });

        if (profiles) {
          // Traer roles para complementar
          const { data: users } = await supabase
            .from('users')
            .select('id, role');

          const enriched = profiles.map((p) => {
            const userMatch = users?.find((u) => u.id === p.id);
            return {
              ...p,
              role: userMatch?.role || 'USER',
            };
          });

          setMembers(enriched);
        }
      } catch (err) {
        console.error('Error cargando comunidad:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCommunity();
  }, []);

  // Filtrar según el término de búsqueda
  const filteredMembers = members.filter((m) => {
    const name = (m.artistic_name || m.full_name || '').toLowerCase();
    const loc = `${m.city || ''} ${m.country || ''}`.toLowerCase();
    const query = search.toLowerCase();
    return name.includes(query) || loc.includes(query);
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Invocando a los ilusionistas conectados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Cabecera */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
            🔮 Comunidad de Ilusionistas
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400 max-w-xl mx-auto">
            Conocé, interactuá y compartí conocimientos con los magos registrados en el Laboratorio Mágico.
          </p>
        </div>

        {/* Buscador */}
        <div className="max-w-md mx-auto">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por nombre, país o ciudad..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-250 placeholder-slate-500 shadow-inner"
          />
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <span className="text-4xl mb-3 block">🃏</span>
            <p className="text-sm">No se encontraron ilusionistas para tu búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredMembers.map((member) => {
              const displayName = member.artistic_name || member.full_name || 'Mago Anónimo';
              return (
                <div 
                  key={member.id} 
                  className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-xl hover:border-purple-500/30 transition duration-300 flex flex-col justify-between backdrop-blur-sm relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-xl pointer-events-none" />

                  <div className="space-y-4">
                    
                    {/* Cabecera de la Tarjeta */}
                    <div className="flex items-center gap-4">
                      <UserAvatar 
                        avatarUrl={member.avatar_url} 
                        fullName={member.full_name} 
                        artisticName={member.artistic_name} 
                        size={56} 
                        className="ring-2 ring-purple-500/20"
                      />
                      <div className="min-w-0">
                        <h4 className="text-base font-bold text-slate-100 truncate">{displayName}</h4>
                        <p className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider inline-block mt-1">
                          {member.role || 'USER'}
                        </p>
                      </div>
                    </div>

                    {/* Ubicación */}
                    {(member.city || member.country) && (
                      <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        📍 {member.city}{member.city && member.country ? ', ' : ''}{member.country}
                      </p>
                    )}

                    {/* Presentación Corta */}
                    <p className="text-xs text-slate-400 line-clamp-2 h-8 leading-relaxed">
                      {member.bio || 'Este ilusionista prefiere mantener el misterio... 🃏'}
                    </p>
                  </div>

                  {/* Enlace al perfil */}
                  <div className="pt-5 border-t border-slate-800/60 mt-5">
                    <Link
                      href={`/profile/${member.id}`}
                      className="w-full text-center block px-4 py-2.5 bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/20 rounded-xl text-xs font-bold transition duration-200"
                    >
                      Ver Perfil 🔮
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}