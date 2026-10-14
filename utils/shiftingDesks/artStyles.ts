/**
 * Visual skin choices for Shifting Desks. This is presentation state only:
 * never bake a skin choice into the deterministic run/save schema.
 *
 * Alternative images are opt-in paths. Every missing variant falls back to
 * the shipped Classic art in shifting-desks-art.vue, without changing game data.
 */
export const ART_STYLES = [
  {
    id: 'classic',
    label: 'Classic',
    checkpoint: 'Krea 2',
    mood: 'Mid-century corporate safety posters, halftone gouache, cheerful dread.',
    phase: 'available',
  },
  {
    id: 'corporate-noir',
    label: 'Corporate Noir',
    checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
    mood: 'Western graphic novel inks, deep shadows and noir acting.',
    phase: 'concept',
  },
  {
    id: 'mandatory-fun',
    label: 'Mandatory Fun',
    checkpoint: 'Illustrious/furrytoonmix_xlV3.safetensors',
    mood: 'Expressive inked animation cels and fluorescent workplace farce.',
    phase: 'concept',
  },
  {
    id: 'endless-department',
    label: 'Endless Department',
    checkpoint: 'SDXL/sdxlUnstableDiffusers_nihilmania.safetensors',
    mood: 'Painterly architectural surrealism and colossal subterranean offices.',
    phase: 'concept',
  },
] as const

export type ShiftingDesksArtStyle = (typeof ART_STYLES)[number]['id']
export const ART_STYLE_STORAGE_KEY = 'shifting-desks-art-style-v1'

export function normalizeArtStyle(value: unknown): ShiftingDesksArtStyle {
  return ART_STYLES.find((s) => s.id === value)?.id ?? 'classic'
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
