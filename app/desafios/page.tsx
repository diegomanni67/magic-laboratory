'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserAvatar from '@/components/UserAvatar';

const supabase = createClient();

interface Challenge {
  id: string;
  title: string;
  description: string;
  end_date: string;
}

interface Submission {
  id: string;
  challenge_id: string;
  user_id: string;
  video_url: string;
  created_at: string;
  profiles?: {
    full_name: string | null;
    artistic_name: string | null;
    avatar_url: string | null;
  } | null;
  challenge_votes?: { user_id: string }[];
}

export default function ChallengesPage() {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    async function loadData() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);

      const { data: dbChallenges } = await supabase
        .from('challenges')
        .select('*')
        .order('end_date', { ascending: false })
        .limit(1);

      if (dbChallenges && dbChallenges.length > 0) {
        const activeChallenge = dbChallenges[0];
        setChallenge(activeChallenge);

        const { data: dbSubmissions } = await supabase
          .from('challenge_submissions')
          .select(`
            id,
            challenge_id,
            user_id,
            video_url,
            created_at,
            profiles:user_id (
              full_name,
              artistic_name,
              avatar_url
            ),
            challenge_votes (
              user_id
            )
          `)
          .eq('challenge_id', activeChallenge.id);

        if (dbSubmissions) {
          setSubmissions(dbSubmissions as any);
        }

        if (authUser) {
          const { data: bookmark } = await supabase
            .from('bookmarks')
            .select('*')
            .eq('user_id', authUser.id)
            .eq('challenge_id', activeChallenge.id)
            .maybeSingle();

          if (bookmark) setIsBookmarked(true);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!challenge) return;

    const interval = setInterval(() => {
      const difference = +new Date(challenge.end_date) - +new Date();
      if (difference <= 0) {
        clearInterval(interval);
        return;
      }

      setCountdown({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [challenge]);

  const handleToggleBookmark = async () => {
    if (!user || !challenge) return;

    try {
      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('challenge_id', challenge.id);
        setIsBookmarked(false);
      } else {
        await supabase
          .from('bookmarks')
          .insert({
            user_id: user.id,
            challenge_id: challenge.id,
          });
        setIsBookmarked(true);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleUploadSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !challenge || !videoUrl) return;

    try {
      setSubmitting(true);
      const { error } = await supabase
        .from('challenge_submissions')
        .insert({
          challenge_id: challenge.id,
          user_id: user.id,
          video_url: videoUrl,
        });

      if (error) throw error;

      setShowModal(false);
      setVideoUrl('');
      
      window.location.reload();
    } catch (err: any) {
      console.error('Error submitting video:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (submissionId: string, votes: any[]) => {
    if (!user) return;
    const alreadyVoted = votes.some((v: any) => v.user_id === user.id);

    try {
      if (alreadyVoted) {
        await supabase
          .from('challenge_votes')
          .delete()
          .eq('submission_id', submissionId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('challenge_votes')
          .insert({
            submission_id: submissionId,
            user_id: user.id,
          });
      }

      setSubmissions((prev) =>
        prev.map((sub) => {
          if (sub.id === submissionId) {
            const updatedVotes = alreadyVoted
              ? sub.challenge_votes?.filter((v) => v.user_id !== user.id) || []
              : [...(sub.challenge_votes || []), { user_id: user.id }];
            return { ...sub, challenge_votes: updatedVotes };
          }
          return sub;
        })
      );
    } catch (err) {
      console.error('Error processing vote:', err);
    }
  };

  const parseVideoEmbed = (url: string) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-purple-300">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium">Invocando el desafío de la semana...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-purple-950/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {challenge ? (
          <>
            <div className="bg-slate-900/85 border border-purple-500/20 rounded-2xl p-6 sm:p-8 mb-12 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex justify-between items-start gap-4 mb-4">
                <span className="text-xs bg-purple-950 text-purple-300 border border-purple-500/30 font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl">
                  🏆 Desafío Semanal
                </span>
                
                {user && (
                  <button
                    onClick={handleToggleBookmark}
                    className={`flex items-center gap-2 text-xs border px-4 py-2 rounded-xl transition duration-200 font-bold ${
                      isBookmarked
                        ? 'bg-purple-600 border-purple-500 text-white'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📌 {isBookmarked ? 'Guardado' : 'Guardar Desafío'}
                  </button>
                )}
              </div>

              <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-3">
                {challenge.title}
              </h1>
              
              <p className="text-sm sm:text-base text-slate-300 max-w-3xl mb-6">
                {challenge.description}
              </p>

              <div className="flex items-center gap-3 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60 max-w-sm">
                <span className="text-xl">⏱️</span>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Tiempo restante</p>
                  <p className="text-sm font-black text-purple-400">
                    {countdown.days} días, {countdown.hours} horas, {countdown.minutes} minutos
                  </p>
                </div>
              </div>

              {user && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-6 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black rounded-xl text-sm transition duration-200 shadow-lg shadow-purple-900/40"
                >
                  Participar en el Desafío ✨
                </button>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-200 mb-6 flex items-center gap-2">
                🎬 Participaciones ({submissions.length})
              </h2>

              {submissions.length === 0 ? (
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500">
                  <p className="text-4xl mb-3">🎥</p>
                  <p className="text-sm font-medium">Nadie se postuló todavía. ¡Sé el primero en subir tu video!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {submissions.map((sub) => {
                    const creatorName = sub.profiles?.artistic_name || sub.profiles?.full_name || 'Mago Anónimo';
                    const avatarUrl = sub.profiles?.avatar_url || null;
                    const votesList = sub.challenge_votes || [];
                    const hasVoted = user && votesList.some((v) => v.user_id === user.id);

                    return (
                      <div 
                        key={sub.id} 
                        className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden shadow-lg hover:border-purple-500/30 transition duration-300 flex flex-col"
                      >
                        <div className="p-4 flex items-center gap-3 border-b border-slate-800/60">
                          <UserAvatar 
                            avatarUrl={avatarUrl} 
                            fullName={creatorName} 
                            size={36} 
                            className="border-purple-500/20"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-slate-200">{creatorName}</h4>
                            <p className="text-[10px] text-slate-500">
                              {new Date(sub.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="aspect-video bg-black relative">
                          <iframe
                            src={parseVideoEmbed(sub.video_url)}
                            className="w-full h-full border-0"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>

                        <div className="p-4 flex items-center justify-between bg-slate-900/40 mt-auto">
                          <span className="text-xs text-slate-400 font-semibold">
                            ⭐ {votesList.length} votos
                          </span>
                          
                          {user && (
                            <button
                              onClick={() => handleVote(sub.id, votesList)}
                              className={`text-xs px-4 py-2 rounded-lg font-bold transition duration-200 ${
                                hasVoted
                                  ? 'bg-purple-950 text-purple-300 border border-purple-500/30'
                                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'
                              }`}
                            >
                              {hasVoted ? 'Quitár Voto 💔' : 'Votar ✨'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <span className="text-5xl mb-4 block">🔮</span>
            <h2 className="text-xl font-bold text-slate-200">Próximo desafío preparándose en el laboratorio...</h2>
            <p className="text-xs text-slate-500 mt-1">Nuestros magos administradores están ideando la siguiente prueba.</p>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl relative">
              <h3 className="text-lg font-bold text-white mb-2">🚀 Subir tu Participación</h3>
              <p className="text-xs text-slate-400 mb-6">Contanos tu técnica y compartí el enlace de tu video de práctica.</p>

              <form onSubmit={handleUploadSubmission} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Enlace de tu Video (YouTube, Vimeo o URL directo)
                  </label>
                  <input
                    type="url"
                    required
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="Ej: https://www.youtube.com/watch?v=xxx"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-purple-500 transition duration-200"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs transition duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-xl text-xs transition duration-200 disabled:opacity-50"
                  >
                    {submitting ? 'Subiendo...' : 'Publicar Video ✨'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}