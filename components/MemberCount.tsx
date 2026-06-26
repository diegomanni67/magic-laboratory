"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MemberCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchMemberCount() {
      const supabase = createClient()
      // Pedimos solo los IDs para que sea liviano, y contamos el resultado
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
      
      if (!error && data) {
        setCount(data.length)
      } else {
        setCount(0) // O null si prefieres ocultarlo en caso de error
      }
    }

    fetchMemberCount()
  }, [])

  if (count === null) return null // No muestra nada mientras carga

  return (
    <div className="mt-8 text-center">
      <p className="text-amber-500/60 text-sm font-medium">
        <span className="text-amber-400 font-bold">{count}</span> magos activos en el laboratorio
      </p>
    </div>
  )
}