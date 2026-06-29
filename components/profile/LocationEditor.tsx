"use client"

import { useEffect, useState } from "react"
import { MapPin } from "lucide-react"

export function LocationEditor({
  initialCountry,
  initialCity,
  onUpdated,
}: {
  initialCountry?: string | null
  initialCity?: string | null
  onUpdated?: () => void
}) {
  const [country, setCountry] = useState(initialCountry || "")
  const [city, setCity] = useState(initialCity || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    setCountry(initialCountry || "")
    setCity(initialCity || "")
  }, [initialCountry, initialCity])

  const handleSave = async () => {
    setSaving(true)
    setMessage("")
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ country, city }),
    })
    const data = await res.json()
    setSaving(false)
    if (!res.ok) {
      setMessage(data.error || "No se pudo guardar")
      return
    }
    setMessage("Ubicación actualizada")
    onUpdated?.()
  }

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300">
          <MapPin className="size-5" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Tu ubicación</h3>
          <p className="text-sm text-white/50">Añade país y ciudad para que otros te encuentren</p>
        </div>
      </div>
      <div className="space-y-3">
        <input value={country} onChange={(event) => setCountry(event.target.value)} placeholder="País" className="w-full rounded-2xl border border-white/10 bg-[#0b1224] px-4 py-3 text-white" />
        <input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ciudad" className="w-full rounded-2xl border border-white/10 bg-[#0b1224] px-4 py-3 text-white" />
        <button onClick={handleSave} disabled={saving} className="rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-2 font-semibold">
          {saving ? "Guardando..." : "Guardar ubicación"}
        </button>
        {message ? <p className="text-sm text-amber-300">{message}</p> : null}
      </div>
    </div>
  )
}
