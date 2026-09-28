// /utils/artStyleCatalog.ts
/*
 * The default art styles, shared by the Daily Dream renderer and the art
 * generator's Style picker (Silas, 2026-09-28: "an overall upgrade to the random
 * default styles that we use for daily dream, including that super vibrant
 * cartoon style ... and I want the default styles to all be included as options
 * in the art generator when creating fresh works").
 *
 * config/art-style-catalog.json is the one list. Conductor's Daily Dream
 * builder (scripts/dream_art_prompts.py) reads a byte-identical copy at
 * scripts/data/art-style-catalog.json -- edit this one, then copy it across.
 *
 * `weight` is how often the Daily Dream lane lands on a style relative to the
 * others. Vibrant styles carry 2-4, moody ones 1, so a gloomy day still happens
 * but only about one day in sixteen -- the complaint was that most days came out
 * gloomy, not that none should.
 *
 * Every prompt names a medium to paint, never a prohibition: Krea 2 renders at
 * cfg 1, where a negative prompt is inert and a negated noun is positive
 * conditioning (server/utils/artPromptContract.ts).
 */
import catalog from '../config/art-style-catalog.json'

export type ArtStyleMood = 'vibrant' | 'moody'

export interface ArtStyle {
  id: string
  label: string
  mood: ArtStyleMood
  weight: number
  prompt: string
}

export const ART_STYLE_CATALOG: readonly ArtStyle[] = (
  catalog.styles as ArtStyle[]
).map((style) => Object.freeze({ ...style }))

export function getArtStyle(id: string | null | undefined): ArtStyle | null {
  if (!id) return null
  return ART_STYLE_CATALOG.find((style) => style.id === id) ?? null
}

/**
 * Deterministic weighted pick: the same key always lands on the same style,
 * and heavier styles own proportionally more of the key space.
 */
export function weightedArtStyleFor(hash: number): ArtStyle {
  const total = ART_STYLE_CATALOG.reduce((sum, style) => sum + style.weight, 0)
  let slot = (hash >>> 0) % total
  for (const style of ART_STYLE_CATALOG) {
    if (slot < style.weight) return style
    slot -= style.weight
  }
  return ART_STYLE_CATALOG[0]!
}

export function randomArtStyle(random: () => number = Math.random): ArtStyle {
  return weightedArtStyleFor(Math.floor(random() * 0x100000000))
}

/** Append a style's medium to a prompt, once. */
export function withArtStyle(prompt: string, style: ArtStyle | null): string {
  const base = String(prompt || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\s,.;]+$/, '')
  if (!style) return base
  if (base.includes(style.prompt)) return base
  return base ? `${base}, ${style.prompt}` : style.prompt
}
