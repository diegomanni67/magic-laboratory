import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { aiAnalysisService } from '@/lib/ai-analysis'

export async function POST(request: Request) {
  const { videoId } = await request.json()

  if (!videoId) {
    return NextResponse.json({ error: 'videoId es obligatorio' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: video, error: videoError } = await admin
    .from('practice_videos')
    .select('id, video_url, technique_category, difficulty_level, description')
    .eq('id', videoId)
    .single()

  if (videoError || !video) {
    return NextResponse.json({ error: 'Práctica no encontrada' }, { status: 404 })
  }

  try {
    const result = await aiAnalysisService.analyzePracticeVideo(
      video.video_url,
      video.technique_category,
      video.difficulty_level,
      video.description
    )

    const { data: saved, error: saveError } = await admin
      .from('ai_analyses')
      .insert({
        video_id: video.id,
        analysis_text: result.analysisText,
        technical_score: result.technicalScore,
        performance_score: result.performanceScore,
        suggestions: result.suggestions,
        strengths: result.strengths,
        areas_for_improvement: result.areasForImprovement,
        model_version: 'gemini-2.5-flash',
      })
      .select()
      .single()

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    return NextResponse.json({ analysis: saved })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Error al analizar la práctica' },
      { status: 500 }
    )
  }
}
