"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Filter, MapPin, Sparkles, ArrowLeft, Upload, Pencil, MessageSquare, MessageCircle, Send } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
    artistic_name: string | null
    country: string | null
    city: string | null
  } | null
}

type Comment = {
  id: string
  content: string
  created_at: string
  user_id: string
  users?: {
    name: string | null
    artistic_name: string | null
  } | null
}

export default function MarketplacePage() {
  const router = useRouter()
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<"all" | "venta" | "canje">("all")
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<MarketplaceProduct | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [activeCommentsProductId, setActiveCommentsProductId] = useState<string | null>(null)
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({})
  const [newCommentText, setNewCommentText] = useState("")
  const [loadingComments, setLoadingComments] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "venta" as "venta" | "canje",
    price: "",
    trade_preference: "",
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUser(user)

        const response = await fetch("/api/marketplace")
        const data = await response.json()
        if (response.ok) {
          setProducts((data.products as MarketplaceProduct[]) ?? [])
        } else {
          setError(data.error || "No se pudo cargar el marketplace")
        }
      } catch {
        setError("No se pudo cargar el marketplace")
      } finally {
        setLoading(false)
      }
    }
    void loadData()
  }, [])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = [product.title, product.description, product.trade_preference]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase())
      return matchesQuery && (typeFilter === "all" || product.type === typeFilter)
    })
  }, [products, query, typeFilter])

  const toggleComments = async (productId: string) => {
    if (activeCommentsProductId === productId) {
      setActiveCommentsProductId(null)
      return
    }
    setActiveCommentsProductId(productId)
    setLoadingComments(true)

    try {
      const res = await fetch(`/api/marketplace/comments?productId=${productId}`)
      const data = await res.json()
      if (res.ok) {
        setCommentsMap((prev) => ({ ...prev, [productId]: data.comments }))
      }
    } catch {
      console.error("Error cargando comentarios")
    } finally {
      setLoadingComments(false)
    }
  }

  const handlePostComment = async (productId: string) => {
    if (!newCommentText.trim()) return
    try {
      const res = await fetch("/api/marketplace/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, content: newCommentText }),
      })
      const data = await res.json()
      if (res.ok) {
        setCommentsMap((prev) => ({
          ...prev,
          [productId]: [...(prev[productId] || []), data.comment],
        }))
        setNewCommentText("")
      }
    } catch {
      console.error("Error publicando comentario")
    }
  }

  const handleEditClick = (product: MarketplaceProduct) => {
    setEditingProduct(product)
    setForm({
      title: product.title,
      description: product.description || "",
      type: product.type,
      price: product.price ? String(product.price) : "",
      trade_preference: product.trade_preference || "",
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProduct(null)
    setForm({ title: "", description: "", type: "venta", price: "", trade_preference: "" })
    setImageFile(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError("")
    let finalImageUrl = editingProduct ? editingProduct.image_url : null

    try {
      if (imageFile) {
        const supabase = createClient()
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `products/${fileName}`

        const { error: uploadError } = await supabase.storage.from('marketplace').upload(filePath, imageFile)
        if (uploadError) throw new Error()

        const { data: urlData } = supabase.storage.from('marketplace').getPublicUrl(filePath)
        finalImageUrl = urlData.publicUrl
      }

      const isEditing = Boolean(editingProduct)
      const response = await fetch("/api/marketplace", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingProduct?.id,
          title: form.title,
          description: form.description,
          type: form.type,
          price: form.type === "venta" && form.price ? Number(form.price) : null,
          trade_preference: form.type === "canje" ? form.trade_preference : null,
          image_url: finalImageUrl,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        setError(data.error || "Error procesando solicitud")
      } else {
        setProducts(isEditing ? products.map((p) => p.id === editingProduct?.id ? data.product : p) : [data.product, ...products])
        handleCloseForm()
      }
    } catch {
      setError("No se pudo guardar la publicación")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft className="size-4" /> Volver al inicio
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-400">Marketplace</p>
            <h1 className="text-3xl font-semibold">Vende, intercambia y conecta con la comunidad</h1>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-5 py-3 font-semibold shadow-lg shadow-amber-500/20">
            <Plus className="size-5" /> Publicar producto
          </button>
        </div>

        <div className="mb-6 flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1224] px-3 py-2">
            <Search className="size-4 text-white/40" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por producto..." className="w-full bg-transparent text-sm outline-none md:w-72" />
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0b1224] px-3 py-2">
            <Filter className="size-4 text-white/40" />
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as any)} className="bg-transparent text-sm outline-none">
              <option value="all">Todos</option>
              <option value="venta">Venta</option>
              <option value="canje">Canje</option>
            </select>
          </div>
        </div>

        {error && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}

        {loading ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white/50">Cargando productos...</div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map((product) => (
              <article key={product.id} className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/20 flex flex-col relative group">
                {currentUser?.id === product.user_id && (
                  <button onClick={() => handleEditClick(product)} className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-xl bg-black/60 text-white/80 hover:text-amber-400 border border-white/10 backdrop-blur-md transition-colors">
                    <Pencil className="size-4" />
                  </button>
                )}

                <div className="relative h-48 w-full overflow-hidden bg-[#0b1224] flex items-center justify-center border-b border-white/5">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-fuchsia-500/10">
                      <Sparkles className="size-10 text-amber-300/50" />
                    </div>
                  )}
                </div>

                <div className="space-y-4 p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-semibold line-clamp-1">{product.title}</h2>
                        <p className="text-sm text-white/50">{product.type === "venta" ? "Venta" : "Canje"}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${product.type === "venta" ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300"}`}>
                        {product.type === "venta" ? "Venta" : "Canje"}
                      </span>
                    </div>
                    <p className="text-sm text-white/60 line-clamp-2">{product.description || "Sin descripción"}</p>
                    <div className="rounded-2xl border border-white/10 bg-[#0b1224] p-3 text-sm text-white/70 font-medium">
                      {product.type === "venta" ? `Precio: $${product.price ?? 0}` : `Prefiere: ${product.trade_preference}`}
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <div className="flex items-center justify-between text-sm text-white/50">
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="size-4" /> <span className="truncate">{product.users?.city || "Desconocido"}</span>
                      </div>
                      <span className="text-amber-400 font-medium truncate">@{product.users?.artistic_name || "vendedor"}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button onClick={() => toggleComments(product.id)} className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium hover:bg-white/10 transition-colors">
                        <MessageSquare className="size-3.5" /> Comentarios
                      </button>
                      {currentUser?.id !== product.user_id ? (
                        <button onClick={() => router.push(`/messages?with=${product.user_id}`)} className="flex items-center justify-center gap-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 py-2 text-xs font-medium hover:bg-amber-500/20 transition-colors">
                          <MessageCircle className="size-3.5" /> Contactar
                        </button>
                      ) : (
                        <div className="text-center text-[11px] text-white/30 flex items-center justify-center border border-dashed border-white/10 rounded-xl">Tu producto</div>
                      )}
                    </div>
                  </div>
                </div>

                {activeCommentsProductId === product.id && (
                  <div className="border-t border-white/10 bg-[#0b1120] p-4 space-y-3 max-h-60 overflow-y-auto">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-white/40">Preguntas y Respuestas</h4>
                    {loadingComments ? (
                      <p className="text-xs text-white/40">Cargando...</p>
                    ) : (
                      <div className="space-y-2">
                        {(commentsMap[product.id] || []).length === 0 && <p className="text-xs text-white/30">Nadie preguntó nada todavía.</p>}
                        {(commentsMap[product.id] || []).map((c) => (
                          <div key={c.id} className="text-xs border-b border-white/5 pb-1.5 last:border-0">
                            <span className="font-semibold text-amber-400">@{c.users?.artistic_name || "usuario"}: </span>
                            <span className="text-white/80">{c.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {currentUser && (
                      <div className="flex gap-2 pt-1">
                        <input value={newCommentText} onChange={(e) => setNewCommentText(e.target.value)} placeholder="Escribí tu consulta..." className="flex-1 rounded-xl bg-white/5 px-3 py-1.5 text-xs outline-none border border-white/10 focus:border-amber-500/30" />
                        <button onClick={() => handlePostComment(product.id)} className="rounded-xl bg-amber-500 p-2 text-black hover:opacity-90"><Send className="size-3" /></button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#111827] p-6 my-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{editingProduct ? "Editar producto" : "Publicar producto"}</h3>
              <button onClick={handleCloseForm} className="text-sm text-white/50 hover:text-white">Cerrar</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2 font-medium">Título del producto</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Baraja Bicycle Invisible" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-amber-500/50 text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2 font-medium">Descripción</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Detalles..." className="min-h-24 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2 font-medium">Tipo</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 outline-none text-sm">
                  <option value="venta">Venta</option>
                  <option value="canje">Canje</option>
                </select>
              </div>
              {form.type === "venta" ? (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/40 mb-2 font-medium">Precio (ARS)</label>
                  <input required={form.type === "venta"} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Monto" type="number" className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
                </div>
              ) : (
                <div>
                  <label className="block text-xs uppercase tracking-wider text-white/40 mb-2 font-medium">Preferencia de Canje</label>
                  <input required={form.type === "canje"} value={form.trade_preference} onChange={(e) => setForm({ ...form, trade_preference: e.target.value })} placeholder="Ej: Otras barajas..." className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm" />
                </div>
              )}
              <div>
                <label className="block text-xs uppercase tracking-wider text-white/40 mb-2 font-medium">Foto</label>
                <div className="relative flex items-center justify-center w-full rounded-2xl border border-dashed border-white/20 bg-white/5 p-4">
                  <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="text-center">
                    <Upload className="mx-auto size-6 text-white/40 mb-1" />
                    <p className="text-sm text-white/70 font-medium">{imageFile ? imageFile.name : "Seleccionar imagen"}</p>
                  </div>
                </div>
              </div>
              <button disabled={submitting} className="w-full rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 px-4 py-3 font-semibold disabled:opacity-50 text-sm">
                {submitting ? "Guardando..." : editingProduct ? "Guardar cambios" : "Publicar"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}