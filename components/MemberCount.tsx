"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function MemberCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchMemberCount() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('get_member_count')
        if (!error && typeof data === 'number') {
          setCount(data)
        } else {
          console.error('Error fetching member count:', error)
          setCount(0)
        }
      } catch (err) {
        console.error('Error fetching member count:', err)
        setCount(0)
      }
    }
    fetchMemberCount()
  }, [])

  if (count === null) return null

  return (
    <div className="mt-8 text-center">
      <p className="text-amber-500/60 text-sm font-medium">
        <span className="text-amber-400 font-bold">{count}</span> magos activos en el laboratorio
      </p>
    </div>
  )
}