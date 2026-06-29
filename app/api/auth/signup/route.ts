import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, contraseña y nombre son obligatorios" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      console.error("SIGNUP ERROR:", error)
      return NextResponse.json(
        {
          error: error.message,
          full: error,
        },
        { status: 400 }
      )
    }

    if (data.user) {
      try {
        const admin = createAdminClient()

        const result = await admin.from("users").upsert(
          {
            id: data.user.id,
            email,
            name,
            is_approved: false,
            role: "APPRENTICE",
          },
          { onConflict: "id" }
        )

        if (result.error) {
          console.error("UPSERT ERROR:", result.error)
          return NextResponse.json(
            {
              error: "Error creando perfil",
              full: result.error,
            },
            { status: 500 }
          )
        }
      } catch (e: any) {
        console.error("ADMIN ERROR:", e)

        return NextResponse.json(
          {
            error: "Admin exception",
            full: e?.message ?? e,
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada",
    })
  } catch (e: any) {
    console.error(e)

    return NextResponse.json(
      {
        error: e?.message ?? "Error desconocido",
      },
      { status: 500 }
    )
  }
}