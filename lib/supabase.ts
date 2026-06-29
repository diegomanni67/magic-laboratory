import { createClient } from '@supabase/supabase-js'

// Usamos las variables de Vercel directamente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Si alguna falta, que nos avise claramente en la consola
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Faltan las variables de Supabase en Vercel")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)