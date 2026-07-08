'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface UserProfile {
  name?: string;
  artistic_name?: string;
  bio?: string;
  country?: string;
  city?: string;
  phone?: string;
  instagram?: string;
  youtube?: string;
  studies?: string;
  teacher?: string;
}

export default function ProfileCompletion() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Consultamos la tabla users
        const { data, error } = await supabase
          .from('users')
          .select('name, artistic_name, bio, country, city, phone, instagram, youtube, studies, teacher')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error cargando porcentaje de perfil:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading || !profile) return null;

  // Definición de puntos por cada campo completado (Suma 100%)
  const criteria = [
    { key: 'name', label: 'Nombre real', weight: 10 },
    { key: 'artistic_name', label: 'Nombre artístico', weight: 15 },
    { key: 'bio', label: 'Sobre mí / Biografía', weight: 20 },
    { key: 'country', label: 'País y Ciudad', weight: 15 }, // Se asume completo si tiene country o city
    { key: 'phone', label: 'WhatsApp de contacto', weight: 15 },
    { key: 'instagram', label: 'Redes sociales (Instagram/YouTube)', weight: 10 },
    { key: 'studies', label: 'Estudios mágicos', weight: 10 },
    { key: 'teacher', label: 'Profesor / Mentor', weight: 5 },
  ];

  // Calcular porcentaje total
  let completedPercent = 0;
  const missingTasks: string[] = [];

  criteria.forEach((item) => {
    let isComplete = false;

    if (item.key === 'country') {
      isComplete = !!(profile.country || profile.city);
    } else if (item.key === 'instagram') {
      isComplete = !!(profile.instagram || profile.youtube);
    } else {
      isComplete = !!profile[item.key as keyof UserProfile];
    }

    if (isComplete) {
      completedPercent += item.weight;
    } else {
      missingTasks.push(item.label);
    }
  });

  // Si el perfil está al 100%, no mostramos el cartel de advertencia
  if (completedPercent === 100) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-8">
      <div className="rounded-3xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-indigo-900/10 p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">✨</span>
              <div>
                <h3 className="text-lg font-semibold text-white">¡Potenciá tu Perfil de Mago!</h3>
                <p className="text-sm text-white/60 mt-1">
                  Completá tus datos para que otros ilusionistas te conozcan, te contacten y vean tu trayectoria.
                </p>
              </div>
            </div>

            <div className="text-3xl font-bold text-purple-300 mb-4">{completedPercent}%</div>

            {/* Barra de Progreso */}
            <div className="w-full bg-slate-800 rounded-full h-3.5 mt-4 overflow-hidden border border-slate-700">
              <div 
                className="bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 h-3.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${completedPercent}%` }}
              />
            </div>

            {/* Tareas Pendientes */}
            <div className="mt-4">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pendiente por rellenar:</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {missingTasks.slice(0, 3).map((task, idx) => (
                  <span key={idx} className="text-xs bg-slate-800/80 text-slate-300 px-2.5 py-1 rounded-full border border-slate-700/50 flex items-center gap-1">
                    ➕ {task}
                  </span>
                ))}
                {missingTasks.length > 3 && (
                  <span className="text-xs text-purple-300 font-medium self-center pl-1">
                    y {missingTasks.length - 3} más...
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Acción */}
          <div className="flex items-center">
            <Link 
              href="/profile" 
              className="bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition duration-200 shadow-lg shadow-purple-900/30 flex items-center gap-2 whitespace-nowrap"
            >
              🔮 Completar mi Perfil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
