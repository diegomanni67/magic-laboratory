'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';

const supabase = createClient();

interface ProfileForm {
  name: string;
  artistic_name: string;
  bio: string;
  country: string;
  city: string;
  phone: string;
  instagram: string;
  youtube: string;
  studies: string;
  teacher: string;
  avatar_url: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    name: '',
    artistic_name: '',
    bio: '',
    country: '',
    city: '',
    phone: '',
    instagram: '',
    youtube: '',
    studies: '',
    teacher: '',
    avatar_url: '',
  });

  useEffect(() => {
    async function loadUserProfile() {
      try {
        setLoading(true);
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !authUser) {
          router.push('/login');
          return;
        }

        setUser(authUser);

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profile) {
          setForm({
            name: profile.full_name || '',
            artistic_name: profile.artistic_name || '',
            bio: profile.bio || '',
            country: profile.country || '',
            city: profile.city || '',
            phone: profile.phone || '',
            instagram: profile.instagram || '',
            youtube: profile.youtube || '',
            studies: profile.studies || '',
            teacher: profile.teacher || '',
            avatar_url: profile.avatar_url || '',
          });
        }
      } catch (err: any) {
        console.error('Error cargando perfil:', err);
        setMessage({ type: 'error', text: 'Error al conectar con el servidor mágico.' });
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [router]);

  const calculateProgress = () => {
    let total = 0;
    if (form.name) total += 10;
    if (form.artistic_name) total += 15;
    if (form.bio) total += 20;
    if (form.country || form.city) total += 15;
    if (form.phone) total += 15;
    if (form.instagram || form.youtube) total += 10;
    if (form.studies) total += 10;
    if (form.teacher) total += 5;
    return total;
  };

  const progressPercent = calculateProgress();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploading(true);
      setMessage(null);
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al subir la imagen');

      setForm((prev) => ({ ...prev, avatar_url: data.url }));
      setMessage({ type: 'success', text: '📷 ¡Foto cargada! Presioná Guardar para confirmar los cambios.' });
    } catch (err: any) {
      console.error('Error subiendo avatar:', err);
      setMessage({ type: 'error', text: err.message || 'Error al subir la imagen de perfil.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: form.name,
          artistic_name: form.artistic_name,
          bio: form.bio,
          country: form.country,
          city: form.city,
          phone: form.phone,
          instagram: form.instagram,
          youtube: form.youtube,
          studies: form.studies,
          teacher: form.teacher,
          avatar_url: form.avatar_url,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setMessage({ type: 'success', text: '✨ ¡Perfil de mago guardado con éxito!' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error guardando perfil:', err);
      setMessage({ type: 'error', text: 'No se pudo guardar la información.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Abriendo el libro de hechizos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400">
            🔮 Tu Perfil de Ilusionista
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-400">
            Completá tu identidad mágica para interactuar y destacar en la comunidad.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl mb-6 border ${
            message.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}>
            <p className="text-sm font-medium flex items-center gap-2">
              {message.type === 'success' ? '✨' : '⚠️'} {message.text}
            </p>
          </div>
        )}

        <div className="bg-slate-900/80 border border-purple-500/20 rounded-2xl p-6 mb-8 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
            <div>
              <h3 className="text-lg font-bold text-purple-300">Progreso de tu Perfil</h3>
              <p className="text-xs text-slate-400">Un perfil completo genera mayor autoridad en el laboratorio.</p>
            </div>
            <span className="text-xl font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/20">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-800">
            <div 
              className="bg-gradient-to-r from-purple-600 via-fuchsia-500 to-cyan-400 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2 border-b border-slate-800 pb-3">
              🃏 Identidad del Mago
            </h2>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              
              <div className="flex flex-col items-center gap-3">
                <UserAvatar 
                  avatarUrl={form.avatar_url} 
                  fullName={form.name} 
                  artisticName={form.artistic_name} 
                  size={120} 
                  className="ring-4 ring-purple-500/30"
                />
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleAvatarUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/30 font-medium px-4 py-2 rounded-xl transition duration-200 disabled:opacity-50"
                >
                  {uploading ? 'Cargando...' : 'Cambiar Foto de Mago 📷'}
                </button>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Nombre Real / Completo
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: David Seth Kotkin"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    ✨ Nombre Artístico
                  </label>
                  <input
                    type="text"
                    value={form.artistic_name}
                    onChange={(e) => setForm({ ...form, artistic_name: e.target.value })}
                    placeholder="Ej: David Copperfield"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                  />
                </div>
              </div>

            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              📖 Biografía Mágica
            </h2>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Sobre mí / Presentación
              </label>
              <textarea
                rows={4}
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Contanos tus especialidades, qué disciplinas te apasionan o qué buscás aprender..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200 resize-none"
              />
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              📍 Ubicación y Redes de Contacto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">País</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Ej: Argentina"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Ciudad</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Ej: Buenos Aires"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">📞 WhatsApp (Sin el símbolo +)</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Ej: 5491155554433"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">📸 Instagram (Usuario)</label>
                <input
                  type="text"
                  value={form.instagram}
                  onChange={(e) => setForm({ ...form, instagram: e.target.value })}
                  placeholder="Ej: mi_instagram_magico"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">🎥 Canal de YouTube (Enlace completo)</label>
                <input
                  type="text"
                  value={form.youtube}
                  onChange={(e) => setForm({ ...form, youtube: e.target.value })}
                  placeholder="Ej: https://youtube.com/@mi_canal_magico"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-lg backdrop-blur-sm">
            <h2 className="text-xl font-bold text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-800 pb-3">
              🎓 Formación y Legado
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Estudios Mágicos
                </label>
                <input
                  type="text"
                  value={form.studies}
                  onChange={(e) => setForm({ ...form, studies: e.target.value })}
                  placeholder="Ej: Autodidacta, Escuela Fu-Manchú, etc."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  🎩 Mentor / Profesor Principal
                </label>
                <input
                  type="text"
                  value={form.teacher}
                  onChange={(e) => setForm({ ...form, teacher: e.target.value })}
                  placeholder="Ej: René Lavand"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4 mt-8">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 font-bold rounded-xl transition duration-200 text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl transition duration-200 text-sm shadow-lg shadow-purple-900/40 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : '✨ Guardar Perfil'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}