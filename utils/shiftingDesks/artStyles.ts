/**
 * Visual skin choices for Shifting Desks. This is presentation state only:
 * never bake a skin choice into the deterministic run/save schema.
 *
 * Alternative images are opt-in paths. Every missing variant falls back to
 * the shipped Classic art in shifting-desks-art.vue, without changing game data.
 */
export const ART_STYLES = [
  {
    id: 'western-cartoon',
    label: 'Western Cartoon',
    checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
    blurb: 'Illustrious. Warm animated-feature inks under green fluorescents.',
    mood: 'Cinematic western animated-feature illustration: expressive staging, bold ink, warm orange and eerie fluorescent-green light, glossy character detail.',
    phase: 'available',
  },
  {
    id: 'corporate-noir',
    label: 'Noir',
    checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
    blurb: 'Illustrious. Graphic-novel shadows and phosphor glow.',
    mood: 'Western graphic novel inks, deep shadows and noir acting.',
    phase: 'available',
  },
  {
    id: 'classic',
    label: 'Classic',
    checkpoint: 'Krea 2',
    blurb: 'Krea 2. Mid-century safety posters, cheerful dread.',
    mood: 'Mid-century corporate safety posters, halftone gouache, cheerful dread.',
    phase: 'available',
  },
] as const

// Silas, 2026-10-14: "Illustrious should be the default."
export const DEFAULT_ART_STYLE = 'western-cartoon'
// The same card in every edition, so the picker compares like with like.
export const ART_STYLE_SAMPLE =
  '/images/shifting-desks/cards/orientation/gus-shop-steward.webp'

export type ShiftingDesksArtStyle = (typeof ART_STYLES)[number]['id']
// v2: earlier visitors were saved on Classic before they ever chose it.
export const ART_STYLE_STORAGE_KEY = 'shifting-desks-art-style-v2'

export function normalizeArtStyle(value: unknown): ShiftingDesksArtStyle {
  return ART_STYLES.find((s) => s.id === value)?.id ?? DEFAULT_ART_STYLE
}

/** A stable, separate namespace so Classic assets can never be overwritten. */
export function artStyleImageSrc(baseSrc: string, style: unknown): string {
  const selected = normalizeArtStyle(style)
  return selected !== 'classic' && baseSrc.startsWith('/images/shifting-desks/')
    ? baseSrc.replace(
        '/images/shifting-desks/',
        `/images/shifting-desks/styles/${selected}/`,
      )
    : baseSrc
}

export function loadArtStylePreference(): ShiftingDesksArtStyle {
  try {
    return normalizeArtStyle(localStorage.getItem(ART_STYLE_STORAGE_KEY))
  } catch {
    return DEFAULT_ART_STYLE
  }
}

export function saveArtStylePreference(style: ShiftingDesksArtStyle): void {
  try {
    localStorage.setItem(ART_STYLE_STORAGE_KEY, style)
  } catch {
    // Browser storage is optional; art selection remains usable in memory.
  }
}
