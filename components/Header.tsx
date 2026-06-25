"use client"

// VERSIÓN LOCAL ABIERTA - SIN LOGIN REQUERIDO

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import Link from 'next/link'
import { User, Bell, Menu, X, Wand2 } from 'lucide-react'

export function Header() {
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-blue-800/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <span className="text-white font-bold text-xl">Magic Laboratory</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#laboratory" className="text-white/50 hover:text-white transition-colors">Laboratorio</Link>
            <Link href="#community" className="text-white/50 hover:text-white transition-colors">Logia</Link>
            <Link href="#membership" className="text-white/50 hover:text-white transition-colors">Membresía</Link>
          </nav>

          {/* User Actions - VERSIÓN LOCAL ABIERTA */}
          <div className="flex items-center gap-3">
            <Link href="/auth" className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transition-colors font-semibold">
              <span className="hidden sm:inline">Unirse</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-2xl bg-amber-800/50 text-amber-100 hover:bg-amber-700/50 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900/90 backdrop-blur-md border-t border-amber-800/50">
          <div className="px-4 py-3 space-y-2">
            <Link href="#laboratory" className="block px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-amber-800/30">Laboratorio</Link>
            <Link href="#community" className="block px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-amber-800/30">Logia</Link>
            <Link href="#membership" className="block px-3 py-2 rounded-xl text-white/50 hover:text-white hover:bg-amber-800/30">Membresía</Link>
          </div>
        </div>
      )}
    </header>
  )
}
