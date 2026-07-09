'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';

const supabase = createClient();

interface CurrentUser {
  id: string;
  full_name: string | null;
  artistic_name: string | null;
  avatar_url: string | null;
}

export default function ForumNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getSessionAndProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (authUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, artistic_name, avatar_url')
            .eq('id', authUser.id)
            .single();

          if (profile) {
            setUserProfile(profile);
          } else {
            setUserProfile({
              id: authUser.id,
              full_name: authUser.user_metadata?.full_name || 'Mago',
              artistic_name: null,
              avatar_url: null,
            });
          }
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('Error cargando usuario en ForumNavbar:', err);
      } finally {
        setLoading(false);
      }
    }

    getSessionAndProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getSessionAndProfile();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
    router.push('/login');
  };

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Comunidad', path: '/community' },
    { name: 'Desafíos 🏆', path: '/desafios' },
    { name: 'Chat En Vivo 💬', path: '/chat' },
  ];

  return (
    <nav className="bg-slate-950 border-b border-slate-900 px-4 sm:px-6 lg:px-8 py-4 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
            🔮 Magic Laboratory
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                href={link.path}
                className={`text-sm font-semibold transition ${
                  isActive 
                    ? 'text-purple-300' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
          {!loading && userProfile ? (
            <div className="flex items-center gap-3">
              
              <Link 
                href={`/profile/${userProfile.id}`}
                className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-850 px-4 py-2 rounded-xl border border-slate-850 hover:border-purple-500/20 transition duration-200 shadow-md group"
              >
                <UserAvatar 
                  avatarUrl={userProfile.avatar_url} 
                  fullName={userProfile.full_name} 
                  artisticName={userProfile.artistic_name} 
                  size={28} 
                  className="ring-1 ring-purple-500/20 group-hover:ring-purple-500/40"
                />
                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition">
                  {userProfile.artistic_name || userProfile.full_name || 'Mi Perfil'}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold transition duration-150"
              >
                Salir
              </button>

            </div>
          ) : (
            !loading && (
              <Link
                href="/login"
                className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs transition duration-200 shadow-md"
              >
                Ingresar ✨
              </Link>
            )
          )}
        </div>

      </div>
    </nav>
  );
}