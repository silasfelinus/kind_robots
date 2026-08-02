// /utils/narrativeIngredients.ts

import { resolveEntityArtwork } from '@/utils/artImageSrc'

export type NarrativeIngredientOption = {
  id?: number | string
  slug: string
  title: string
  description?: string | null
  flavorText?: string | null
  imagePath?: string | null
  cardPath?: string | null
  heroPath?: string | null
  icon?: string | null
  badge?: string | null
}

// Kept as a named export because verifyNarrativePrimitives.ts pins it and the
// ingredient pickers read better for it; the chain itself now lives in one place.
export function narrativeIngredientArtwork(
  ingredient: NarrativeIngredientOption,
): string | null {
  return resolveEntityArtwork(ingredient)
}

export function narrativeIngredientSummary(
  ingredient: NarrativeIngredientOption,
): string {
  return ingredient.flavorText || ingredient.description || ''
}

export function pickRandomNarrativeIngredient<T>(
  ingredients: readonly T[],
): T | undefined {
  if (!ingredients.length) return undefined
  return ingredients[Math.floor(Math.random() * ingredients.length)]
}

export function parseNarrativeTags(value: string, limit = 6): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, Math.max(0, limit))
}
