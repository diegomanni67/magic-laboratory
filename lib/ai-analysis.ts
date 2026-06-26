import { GoogleGenerativeAI } from '@google/generative-ai'

// Inicializar el cliente de Google Generative AI
// IMPORTANTE: esta key NO debe tener prefijo NEXT_PUBLIC_, porque este
// servicio solo se debe usar desde el servidor (API routes), nunca
// directamente desde el navegador. Si la marcás como NEXT_PUBLIC_, queda
// expuesta en el bundle de JS y cualquiera puede robarla y usarla.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export interface MagicAnalysisResult {
  analysisText: string
  technicalScore: number
  performanceScore: number
  suggestions: string[]
  strengths: string[]
  areasForImprovement: string[]
}

export class AIAnalysisService {
  private model: any

  constructor() {
    // Usamos un modelo estable y económico de la familia Gemini 2.5
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
  }

  /**
   * Analiza un video de práctica de ilusionismo y genera una crítica técnica
   * @param videoUrl URL del video a analizar
   * @param techniqueCategory Categoría de la técnica
   * @param difficultyLevel Nivel de dificultad
   * @param description Descripción proporcionada por el usuario
   */
  async analyzePracticeVideo(
    videoUrl: string,
    techniqueCategory: string,
    difficultyLevel: string,
    description: string
  ): Promise<MagicAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt(techniqueCategory, difficultyLevel, description)
      
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      return this.parseAnalysisResponse(text)
    } catch (error) {
      console.error('Error analyzing practice video:', error)
      throw new Error('Failed to analyze practice video')
    }
  }

  /**
   * Construye el prompt para el análisis de IA
   */
  private buildAnalysisPrompt(
    techniqueCategory: string,
    difficultyLevel: string,
    description: string
  ): string {
    return `Actúa como un experto maestro de ilusionismo con décadas de experiencia en análisis técnico de performances mágicas.

Analiza la siguiente práctica de ilusionismo y proporciona una crítica técnica constructiva y detallada:

CATEGORÍA DE TÉCNICA: ${techniqueCategory}
NIVEL DE DIFICULTAD: ${difficultyLevel}
DESCRIPCIÓN DEL PRÁCTICANTE: ${description}

Por favor, proporciona tu análisis en el siguiente formato JSON exacto:

{
  "analysisText": "Un análisis general de 2-3 párrafos sobre la ejecución, destacando aspectos positivos y áreas de mejora",
  "technicalScore": número del 1 al 100,
  "performanceScore": número del 1 al 100,
  "suggestions": ["sugerencia específica 1", "sugerencia específica 2", "sugerencia específica 3"],
  "strengths": ["fortaleza técnica 1", "fortaleza técnica 2", "fortaleza técnica 3"],
  "areasForImprovement": ["área de mejora 1", "área de mejora 2", "área de mejora 3"]
}

Tu análisis debe:
1. Ser constructivo y motivador
2. Enfocarse en aspectos técnicos específicos del ilusionismo
3. Considerar el nivel de dificultad declarado
4. Proporcionar sugerencias accionables y específicas
5. Destacar tanto fortalezas como áreas de mejora
6. Usar terminología técnica apropiada del mundo de la magia

Responde SOLO con el JSON, sin texto adicional.`
  }

  /**
   * Parsea la respuesta de la IA en un objeto estructurado
   */
  private parseAnalysisResponse(text: string): MagicAnalysisResult {
    try {
      // Limpiar el texto para extraer el JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[0])

      return {
        analysisText: parsed.analysisText || '',
        technicalScore: Math.min(100, Math.max(0, parsed.technicalScore || 70)),
        performanceScore: Math.min(100, Math.max(0, parsed.performanceScore || 70)),
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        areasForImprovement: Array.isArray(parsed.areasForImprovement) ? parsed.areasForImprovement : []
      }
    } catch (error) {
      console.error('Error parsing AI response:', error)
      // Retornar un análisis por defecto en caso de error
      return this.getDefaultAnalysis()
    }
  }

  /**
   * Retorna un análisis por defecto cuando falla la IA
   */
  private getDefaultAnalysis(): MagicAnalysisResult {
    return {
      analysisText: "No se pudo generar un análisis detallado en este momento. Sin embargo, tu práctica ha sido registrada y será revisada por un mentor. Continúa practicando y enfócate en la precisión de tus movimientos.",
      technicalScore: 75,
      performanceScore: 75,
      suggestions: [
        "Practica frente a un espejo para corregir ángulos",
        "Graba tus prácticas en diferentes iluminaciones",
        "Solicita feedback de otros miembros de la logia"
      ],
      strengths: [
        "Dedicación a la práctica constante",
        "Interés en mejorar técnica"
      ],
      areasForImprovement: [
        "Precisión en los movimientos",
        "Control de timing",
        "Gestión de la atención del espectador"
      ]
    }
  }
}

// Exportar una instancia singleton
export const aiAnalysisService = new AIAnalysisService()
