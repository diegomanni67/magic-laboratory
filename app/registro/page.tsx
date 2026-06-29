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
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (data.user) {
      const admin = createAdminClient()

      const { error: profileError } = await admin
        .from("users")
        .upsert(
          {
            id: data.user.id,
            email,
            name,
            is_approved: false,
            role: "APPRENTICE",
          },
          { onConflict: "id" }
        )

      if (profileError) {
        console.error(profileError)
        return NextResponse.json(
          { error: profileError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada. Espera la aprobación de un administrador.",
    })
  } catch (err: any) {
    console.error(err)

    return NextResponse.json(
      {
        error: err?.message ?? String(err),
      },
      { status: 500 }
    )
  }
}