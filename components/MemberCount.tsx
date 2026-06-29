"use client"

import { useEffect, useState } from "react"

export default function MemberCount() {
  const [count, setCount] = useState<number | null>(null)

  useEffect(() => {
    async function fetchMemberCount() {
      try {
        const response = await fetch("/api/member-count")
        const data = await response.json()
        if (response.ok && typeof data.count === "number") {
          setCount(data.count)
        } else {
          console.error("Error fetching member count:", data)
          setCount(0)
        }
      } catch (err) {
        console.error("Error fetching member count:", err)
        setCount(0)
      }
    }

    void fetchMemberCount()
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