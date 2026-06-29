import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { getSupabaseAnonKey, getSupabaseServiceRoleKey, getSupabaseUrl } from "@/lib/supabase/env"

function isPlaceholderValue(value?: string) {
  if (!value) return true
  return value.includes("placeholder") || value.includes("your-") || value.includes("tu-")
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Error desconocido"
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { email, password, name, country, city } = body as {
      email?: string
      password?: string
      name?: string
      country?: string
      city?: string
    }

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son obligatorios" },
        { status: 400 }
      )
    }

    const supabaseUrl = getSupabaseUrl()
    const supabaseAnonKey = getSupabaseAnonKey()
    const supabaseServiceRoleKey = getSupabaseServiceRoleKey()

    console.error("[signup] Supabase env status", {
      hasUrl: Boolean(supabaseUrl) && !isPlaceholderValue(supabaseUrl),
      hasAnonKey: Boolean(supabaseAnonKey) && !isPlaceholderValue(supabaseAnonKey),
      hasServiceRoleKey: Boolean(supabaseServiceRoleKey) && !isPlaceholderValue(supabaseServiceRoleKey),
      nodeEnv: process.env.NODE_ENV,
      vercel: Boolean(process.env.VERCEL),
    })

    if (!supabaseUrl || !supabaseAnonKey || isPlaceholderValue(supabaseUrl) || isPlaceholderValue(supabaseAnonKey)) {
      console.error("[signup] Missing or placeholder public Supabase config", {
        supabaseUrl,
        hasAnonKey: Boolean(supabaseAnonKey) && !isPlaceholderValue(supabaseAnonKey),
      })

      return NextResponse.json(
        { error: "La configuración pública de Supabase no está disponible en el servidor" },
        { status: 500 }
      )
    }

    const publicClient = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })

    let data
    let error

    try {
      ;({ data, error } = await publicClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            country: country?.trim() || null,
            city: city?.trim() || null,
          },
        },
      }))
    } catch (signUpError) {
      console.error("[signup] signUp exception", {
        error: signUpError,
        message: getErrorMessage(signUpError),
      })

      return NextResponse.json(
        {
          error: "No se pudo crear la cuenta con Supabase",
          detail: getErrorMessage(signUpError),
        },
        { status: 500 }
      )
    }

    if (error) {
      console.error("[signup] signUp error", {
        error,
        message: error.message,
      })

      return NextResponse.json(
        {
          error: error.message,
          detail: error,
        },
        { status: 400 }
      )
    }

    if (data.user) {
      try {
        if (!supabaseServiceRoleKey || isPlaceholderValue(supabaseServiceRoleKey)) {
          console.error("[signup] Missing or placeholder service role key", {
            hasServiceRoleKey: Boolean(supabaseServiceRoleKey) && !isPlaceholderValue(supabaseServiceRoleKey),
          })

          return NextResponse.json(
            { error: "La configuración de Supabase para operaciones administrativas no está disponible" },
            { status: 500 }
          )
        }

        const adminClient = createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        })

        const result = await adminClient.from("users").upsert(
          {
            id: data.user.id,
            email,
            name,
            country: country?.trim() || null,
            city: city?.trim() || null,
            is_approved: false,
            role: "APPRENTICE",
          },
          { onConflict: "id" }
        )

        if (result.error) {
          console.error("[signup] users upsert failed", {
            error: result.error,
            message: result.error.message,
          })

          return NextResponse.json(
            {
              error: "Error creando perfil",
              detail: result.error.message,
            },
            { status: 500 }
          )
        }
      } catch (adminError) {
        console.error("[signup] admin profile write failed", {
          error: adminError,
          message: getErrorMessage(adminError),
        })

        return NextResponse.json(
          {
            error: "No se pudo crear el perfil de usuario",
            detail: getErrorMessage(adminError),
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada",
    })
  } catch (error) {
    console.error("[signup] registration failed", {
      error,
      message: getErrorMessage(error),
    })

    return NextResponse.json(
      {
        error: getErrorMessage(error),
      },
      { status: 500 }
    )
  }
}