"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Filter, MapPin, Sparkles, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"

type MarketplaceProduct = {
  id: string
  title: string
  description: string | null
  type: "venta" | "canje"
  price: number | null
  trade_preference: string | null
  image_url: string | null
  created_at: string
  user_id: string
  users?: {
    name: string | null
    country: string | null
    city: string | null
  } | null
}

export default function MarketplacePage() {
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "venta" | "canje">("all")
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "venta" as "venta" | "canje",
    price: "",
    trade_preference: "",
    image_url: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadProducts = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("marketplace_products")
        .select(`*, users: user_id (name, country, city)`)
        .order("created_at", { ascending: false })

      if (!error) {
        setProducts((data as MarketplaceProduct[]) ?? [])
      }
      setLoading(false)
    }

    loadProducts()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = [product.title, product.description, product.trade_preference]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())

      const matchesType = typeFilter === "all" || product.type === typeFilter
      return matchesQuery && matchesType
    })
  }, [products, query, typeFilter])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Debes iniciar sesión para publicar")
      setSubmitting(false)
      return
    }

    const { error } = await supabase.from("marketplace_products").insert({
      title: form.title,
      description: form.description,
      type: form.type,
      price: form.type === "venta" && form.price ? Number(form.price) : null,
      trade_preference: form.type === "canje" ? form.trade_preference : null,
      image_url: form.image_url || null,
      user_id: user.id,
    })

    if (error) {
      setError(error.message)
    } else {
      setForm({ title: "", description: "", type: "venta", price: "", trade_preference: "", image_url: "" })
      setShowForm(false)
      const { data } = await supabase.from("marketplace_products").select(`*, users: user_id (name, country, city)`).order("created_at", { ascending: false })
      setProducts((data as MarketplaceProduct[]) ?? [])
    }

    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="size-4" />
          Volver al inicio
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">Marketplace</p>
            <h1 className="text-3xl font-semibold">Vende, intercambia y conecta con la comunidad</h1>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 font-semibold shadow-lg shadow-amber-500/20"
          >
            <Plus className="size-5" />
            Publicar producto
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1224] px-3 py-2">
            <Search className="size-4 text-white/40" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por producto o preferencia"
              className="w-full bg-transparent text-sm outline-none md:w-72"
            />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1224] px-3 py-2">
            <Filter className="size-4 text-white/40" />
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as any)} className="bg-transparent text-sm outline-none">
              <option value="all">Todos</option>
              <option value="venta">Venta</option>
              <option value="canje">Canje</option>
            </select>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div> : null}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/50">Cargando productos...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-10 text-center text-white/50">
            No hay productos aún. Sé el primero en publicar.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/20">
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-fuchsia-500/20">
                  <Sparkles className="size-10 text-amber-300" />
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{product.title}</h2>
                      <p className="text-sm text-white/50">{product.type === "venta" ? "Venta" : "Canje"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.type === "venta" ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300"}`}>
                      {product.type === "venta" ? "Venta" : "Canje"}
                    </span>
                  </div>
                  <p className="text-sm text-white/60">{product.description || "Sin descripción"}</p>
                  <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-3 text-sm text-white/70">
                    {product.type === "venta" ? `Precio: $${product.price ?? 0}` : `Prefiere: ${product.trade_preference || "algo valioso"}`}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <MapPin className="size-4" />
                    <span>{product.users?.city || "Ubicación no disponible"}, {product.users?.country || ""}</span>
                  </div>
                  <div className="text-sm text-white/70">Vendedor: {product.users?.name || "Usuario"}</div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#111827] p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Publicar producto</h3>
              <button onClick={() => setShowForm(false)} className="text-sm text-white/50">Cerrar</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Título" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Descripción" className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as "venta" | "canje" })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <option value="venta">Venta</option>
                <option value="canje">Canje</option>
              </select>
              {form.type === "venta" ? (
                <input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Precio" type="number" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
              ) : (
                <input value={form.trade_preference} onChange={(event) => setForm({ ...form, trade_preference: event.target.value })} placeholder="Qué te gustaría recibir a cambio" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
              )}
              <input value={form.image_url} onChange={(event) => setForm({ ...form, image_url: event.target.value })} placeholder="URL de imagen (opcional)" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3" />
              <button disabled={submitting} className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 font-semibold">
                {submitting ? "Publicando..." : "Publicar"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
