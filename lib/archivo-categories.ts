export const ARCHIVE_CATEGORIES = [
  { value: "tecnica", label: "Técnica" },
  { value: "recurso", label: "Recurso / Material" },
  { value: "relato", label: "Relato destacado" },
  { value: "otro", label: "Otro" },
] as const

export function archiveCategoryLabel(value: string) {
  return ARCHIVE_CATEGORIES.find((c) => c.value === value)?.label ?? value
}
