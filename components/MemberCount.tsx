"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MemberCount() {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMemberCount() {
      try {
        const supabase = createClient()
        const { count: memberCount, error } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
        
        if (error) {
          console.error('Error fetching member count:', error)
          setCount(0)
        } else {
          setCount(memberCount || 0)
        }
      } catch (error) {
        console.error('Error fetching member count:', error)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchMemberCount()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center mt-8 mb-6">
      {loading ? (
        <div className="text-amber-400/50 text-2xl font-bold">Cargando...</div>
      ) : (
        <div className="text-center">
          <div className="text-5xl sm:text-6xl font-bold text-amber-400 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)]">
            {count}
          </div>
          <div className="text-amber-200/70 text-sm sm:text-base mt-2">
            Miembros en el laboratorio
          </div>
        </div>
      )}
    </div>
  )
}
