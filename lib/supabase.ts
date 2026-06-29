import { createClient } from '@supabase/supabase-js'

// Cambiamos la forma de leer para depuración total
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'TU_URL_AQUI'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'TU_KEY_AQUI'

// NOTA: Reemplaza 'TU_URL_AQUI' y 'TU_KEY_AQUI' con los valores reales 
// que ves en tu panel de Supabase (Settings -> API).
// Esto es solo para confirmar que el problema es la lectura de variables.

export const supabase = createClient(supabaseUrl, supabaseAnonKey)