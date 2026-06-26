"use client"

// VERSIÓN LOCAL ABIERTA - SIN LOGIN REQUERIDO

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { HeroCards } from '@/components/dashboard/hero-cards'
import { Sparkles, Wand2, Users, ArrowRight, Eye } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()

  const handleCardClick = (destination: string) => {
    // VERSIÓN LOCAL ABIERTA - ACCESO DIRECTO
    router.push(destination)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col justify-center">

      {/* Hero Section */}
      <section id="hero" className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          {/* H1 with gradient */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
            Tu arte,{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              al siguiente nivel
            </span>
          </h1>

          {/* Logo Image */}
          <Image
            alt="Magic Laboratory Hero"
            className="w-full max-w-4xl mx-auto rounded-xl shadow-2xl mt-8"
            height={400}
            priority
            src="/logo.png"
            width={800}
          />

          {/* Subtitle */}
          <p className="text-xl text-white/50 max-w-2xl mb-10">
            Únete al laboratorio más exclusivo para el perfeccionamiento del ilusionismo. Sube tus prácticas, recibe análisis técnico con IA y conecta con maestros del arte.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/registro" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/25 text-center">
              Unirse al Laboratorio
            </Link>
            <Link href="#laboratory" className="px-8 py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all backdrop-blur-sm text-center">
              Explorar
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Cards */}
      <section id="laboratory" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12">
        <HeroCards />
      </section>

      {/* Community Section */}
      <section id="community" className="py-24 border-t border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Únete a nuestra logia
            </h2>
            <p className="mt-4 text-lg text-amber-100">
              Conecta con otros ilusionistas y perfecciona tu arte
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Community Features Cards */}
            <div className="grid gap-4">
              <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-300">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Logia Privada</h3>
                  <p className="mt-1 text-white/50">Conecta con maestros del ilusionismo</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/20 text-orange-300">
                  <Eye className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Análisis con IA</h3>
                  <p className="mt-1 text-white/50">Crítica técnica automática de tus prácticas</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-300">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Congresos de Magia</h3>
                  <p className="mt-1 text-white/50">Notificaciones de eventos exclusivos</p>
                </div>
              </div>
            </div>

            {/* Community CTA */}
            <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-900/20 to-orange-800/10 p-8 text-white">
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Compartir Prácticas</h3>
                <p className="mb-6 text-white/60">
                  Sube videos de tus ejecuciones, recibe feedback técnico de IA y de otros maestros. Perfecciona cada movimiento.
                </p>
                <button className="inline-flex items-center gap-2 px-6 py-3 bg-white text-amber-600 rounded-2xl font-semibold hover:bg-amber-50 transition-colors">
                  <Wand2 className="w-5 h-5" />
                  Comenzar a Practicar
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-4">
            <div>
              <div className="mb-4">
                <span className="text-xl font-bold">Magic Laboratory</span>
              </div>
              <p className="text-gray-400">
                Tu laboratorio privado de ilusionismo
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">Explorar</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#laboratory" className="hover:text-white transition-colors">Laboratorio</Link></li>
                <li><Link href="#community" className="hover:text-white transition-colors">Logia</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">Comunidad</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#community" className="hover:text-white transition-colors">Miembros</Link></li>
                <li><Link href="/events" className="hover:text-white transition-colors">Congresos</Link></li>
                <li><Link href="/practice" className="hover:text-white transition-colors">Prácticas</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Ayuda</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contacto</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Términos</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>&copy; 2026 Magic Laboratory. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
