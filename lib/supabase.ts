import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("¡Error crítico! Las variables de Supabase no están llegando a Vercel.")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
