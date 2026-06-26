export const STORY_CATEGORIES = [
  { value: "anecdota", label: "Anécdota" },
  { value: "resena_lugar", label: "Reseña de lugar" },
  { value: "consejo", label: "Consejo" },
  { value: "otro", label: "Otro" },
] as const

export function storyCategoryLabel(value: string) {
  return STORY_CATEGORIES.find((c) => c.value === value)?.label ?? value
}
