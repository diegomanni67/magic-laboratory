'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';
import Link from 'next/link';

const supabase = createClient();

interface ProfileData {
  id: string;
  full_name: string;
  artistic_name: string;
  bio: string;
  country: string;
  city: string;
  phone: string;
  instagram: string;
  youtube: string;
  studies: string;
  teacher: string;
  avatar_url: string | null;
  role?: string;
}

interface Product {
  id: string;
  title: string;
  description: string;
  type: 'venta' | 'canje';
  price: number | null;
  trade_preference: string | null;
  image_url: string | null;
}

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchPublicProfile() {
      try {
        setLoading(true);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (profileError) throw new Error('No se encontró el perfil de este ilusionista.');

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', userId)
          .maybeSingle();

        setProfile({
          ...profileData,
          role: userData?.role || 'USER',
        });

        const { data: productsData } = await supabase
          .from('marketplace_products')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (productsData) {
          setProducts(productsData as Product[]);
        }

      } catch (err: any) {
        console.error('Error cargando perfil:', err);
        setErrorMsg(err.message || 'Error de conexión.');
      } finally {
        setLoading(false);
      }
    }

    fetchPublicProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Leyendo el aura del ilusionista...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 px-4">
        <span className="text-5xl mb-4">🔮</span>
        <h2 className="text-xl font-bold text-slate-200">Perfil no encontrado</h2>
        <p className="text-sm text-slate-500 mt-1">{errorMsg || 'El mago que buscás no existe o no tiene perfil público.'}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition duration-200"
        >
          Volver atrás
        </button>
      </div>
    );
  }

  const displayName = profile.artistic_name || profile.full_name || 'Mago Anónimo';
  const hasSocials = profile.instagram || profile.youtube || profile.phone;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <div className="flex gap-2">
          <button
            onClick={() => router.back()}
            className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition duration-200"
            title="Volver"
          >
            ←
          </button>
          <Link
            href="/"
            className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-400 hover:text-white transition duration-200"
          >
            🏠
          </Link>
        </div>

        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
            
            <UserAvatar 
              avatarUrl={profile.avatar_url} 
              fullName={profile.full_name} 
              artisticName={profile.artistic_name} 
              size={140} 
              className="ring-4 ring-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
            />

            <div className="flex-1 text-center md:text-left space-y-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-white flex flex-col sm:flex-row items-center gap-2 justify-center md:justify-start">
                  {displayName}
                  <span className="text-sm bg-purple-500/20 text-purple-300 border border-purple-500/20 px-2 py-0.5 rounded-lg font-bold">
                    ✨
                  </span>
                </h1>
                {profile.artistic_name && profile.full_name && (
                  <p className="text-xs text-slate-500 mt-1 capitalize">Nombre Real: {profile.full_name}</p>
                )}
              </div>

              {(profile.city || profile.country) && (
                <div className="text-sm text-slate-400 flex items-center justify-center md:justify-start gap-1.5 font-medium">
                  📍 {profile.city}{profile.city && profile.country ? ', ' : ''}{profile.country}
                </div>
              )}

              {hasSocials && (
                <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-pink-950/40 hover:bg-pink-900/60 text-pink-300 border border-pink-500/20 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-2"
                    >
                      📸 Instagram
                    </a>
                  )}

                  {profile.youtube && (
                    <a
                      href={profile.youtube.startsWith('http') ? profile.youtube : `https://youtube.com/${profile.youtube}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-2"
                    >
                      🎥 YouTube
                    </a>
                  )}

                  {profile.phone && (
                    <a
                      href={`https://wa.me/${profile.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/20 rounded-xl text-xs font-bold transition duration-200 flex items-center gap-2"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4">📖 Presentación Mágica</h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {profile.bio || 'Este ilusionista prefiere mantener el misterio y no ha escrito su biografía todavía... 🃏'}
              </p>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm space-y-6">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider">🎓 Formación y Legado</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Estudios Mágicos</p>
                  <p className="text-sm text-slate-200 bg-slate-950/40 border border-slate-850 p-4 rounded-xl font-medium leading-relaxed">
                    {profile.studies || 'Formación autodidacta / Libros del laboratorio.'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Mentor / Profesor Principal</p>
                  <p className="text-sm text-slate-200 bg-slate-950/40 border border-slate-850 p-4 rounded-xl font-medium leading-relaxed">
                    {profile.teacher || 'Sin mentor declarado / Aprendizaje independiente.'}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="space-y-6">
            
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-3">🛠️ Rango en el Laboratorio</h3>
              <div className="flex items-center gap-3 bg-purple-500/5 border border-purple-500/20 p-4 rounded-xl">
                <span className="text-2xl">🎩</span>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Rol Actual</p>
                  <p className="text-sm font-black text-purple-300 uppercase tracking-widest">{profile.role}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
              <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-4">🎪 Publicaciones en Marketplace ({products.length})</h3>
              
              {products.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">Este mago no tiene productos publicados actualmente.</p>
              ) : (
                <div className="space-y-3">
                  {products.map((prod) => (
                    <div 
                      key={prod.id} 
                      className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl flex items-center justify-between gap-3 hover:border-purple-500/30 transition duration-150"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{prod.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase font-semibold mt-0.5">
                          {prod.type === 'venta' ? `💵 $${prod.price}` : '🔄 Canje'}
                        </p>
                      </div>
                      <Link 
                        href={`/marketplace`}
                        className="px-3 py-1.5 bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/20 rounded-lg text-[10px] font-bold transition duration-200 shrink-0"
                      >
                        Ver
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}