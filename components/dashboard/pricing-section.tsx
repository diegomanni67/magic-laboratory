"use client"

// VERSIÓN LOCAL ABIERTA - SIN LOGIN REQUERIDO

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Zap, Shield, Star, ArrowRight, Check } from "lucide-react"
import { cn } from "@/lib/utils"

const benefits = [
  "Acceso completo al Laboratorio",
  "Análisis técnico con IA de tus prácticas",
  "Sesiones de mentoría mensuales", 
  "Biblioteca de técnicas exclusivas",
  "Notificaciones de congresos de magia",
  "Feedback de maestros del ilusionismo"
]

export function PricingSection() {
  const [isHovered, setIsHovered] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleMercadoPagoPayment = async () => {
    setIsLoading(true)
    try {
      // Datos del producto
      const items = [
        {
          id: 'magic-lab-membership',
          title: 'Membresía Magic Laboratory',
          unit_price: 100000, // $100.000 ARS
          quantity: 1,
        },
      ]

      const response = await fetch('/api/mercadopago', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'invitado@koterie.local'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Redirigir a Mercado Pago
        window.location.href = data.init_point
      } else {
        console.error('Error creating payment preference:', data.error)
        alert('Error al procesar el pago. Por favor intenta nuevamente.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      alert('Error al procesar el pago. Por favor intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative max-w-md mx-auto">
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
        {/* Top section with amber translucent background */}
        <div className="bg-amber-500/10 border-b border-amber-500/20 p-8 text-center">
          {/* Plan Premium label */}
          <div className="inline-block mb-4">
            <span className="text-sm font-semibold uppercase tracking-wider text-amber-300">
              Membresía Maestro
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-2xl font-bold text-white/70">USD</span>
            <span className="text-6xl font-extrabold text-white">
              80
            </span>
            <span className="text-xl font-semibold text-white/50">/ mes</span>
          </div>
        </div>

        {/* Content section */}
        <div className="p-8">
          {/* Benefits */}
          <div className="space-y-4 mb-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <div className="flex items-center justify-center rounded-full bg-purple-500/20 p-1.5">
                  <Check className="size-4 text-purple-300" />
                </div>
                <span className="text-sm font-medium text-white/80">{benefit}</span>
              </div>
            ))}
          </div>

          {/* CTA Button - full width */}
          <button
            className={cn(
              "group relative w-full overflow-hidden rounded-2xl px-8 py-4 text-base font-bold transition-all duration-500",
              "bg-gradient-to-r from-amber-600 to-orange-600",
              "text-white shadow-lg shadow-amber-500/25",
              "hover:shadow-amber-500/40 hover:scale-[1.02]",
              "active:scale-[0.98]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleMercadoPagoPayment}
            disabled={isLoading}
          >
            <div className="relative flex items-center justify-center gap-3">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>Unirse al Laboratorio</span>
                  <ArrowRight className={cn(
                    "size-5 transition-transform duration-300",
                    isHovered && "translate-x-1"
                  )} />
                </>
              )}
            </div>
          </button>

          {/* Footer trust message */}
          <div className="text-center mt-6 pt-4 border-t border-white/[0.08]">
            <p className="text-xs text-white/40">
              Cancela cuando quieras • Sin costos ocultos
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
