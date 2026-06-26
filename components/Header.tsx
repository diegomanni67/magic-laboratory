"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { profile, signOut } = useAuth()

  return (
    <header className="w-full bg-amber-950 text-amber-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-xl font-bold text-amber-200">
              Magic Laboratory
            </Link>
          </div>

          {/* Menú Desktop */}
          <div className="hidden md:flex space-x-8 items-center">
            <Link href="/" className="hover:text-amber-300 transition-colors">
              Inicio
            </Link>
            
            {/* Lógica de Autenticación Desktop */}
            {profile ? (
              <div className="flex items-center space-x-4">
                <span className="text-amber-200 font-medium">
                  Hola, {profile.name || 'Mago'}
                </span>
                <button 
                  onClick={signOut}
                  className="px-4 py-2 text-sm bg-red-800 hover:bg-red-700 rounded-xl transition-colors"
                >
                  Salir
                </button>
              </div>
            ) : (
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm bg-amber-700 hover:bg-amber-600 rounded-xl transition-colors"
              >
                Unirse
              </Link>
            )}
          </div>

          {/* Botón Menú Mobile */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-2xl bg-amber-800/50 text-amber-100 hover:bg-amber-700/50 transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Mobile Desplegable */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-amber-900 px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link 
            href="/" 
            className="block px-3 py-2 rounded-md text-base font-medium hover:bg-amber-800 transition-colors"
          >
            Inicio
          </Link>
          
          {/* Lógica de Autenticación Mobile */}
          {profile ? (
            <div className="pt-4 border-t border-amber-800">
              <div className="px-3 py-2 text-amber-200 font-medium">
                Hola, {profile.name || 'Mago'}
              </div>
              <button 
                onClick={signOut}
                className="w-full text-left mt-2 px-3 py-2 text-base font-medium text-red-200 hover:bg-amber-800 rounded-md transition-colors"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link 
              href="/login" 
              className="block mt-4 px-3 py-2 text-center text-base font-medium bg-amber-700 hover:bg-amber-600 rounded-xl transition-colors"
            >
              Unirse
            </Link>
          )}
        </div>
      )}
    </header>
  )
}