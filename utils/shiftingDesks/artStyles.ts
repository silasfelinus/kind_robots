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
    blurb: 'Krea 2. Mid-century safety posters, cheerful dread.',
    mood: 'Mid-century corporate safety posters, halftone gouache, cheerful dread.',
    phase: 'available',
  },
  {
    id: 'western-cartoon',
    label: 'Western Cartoon',
    checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
    blurb: 'Illustrious. Warm animated-feature inks under green fluorescents.',
    mood: 'Cinematic western animated-feature illustration: expressive staging, bold ink, warm orange and eerie fluorescent-green light, glossy character detail.',
    // 2026-11-12: 170/196 story beats failed visual art review. Hide the
    // experimental skin until accepted replacements exist. Classic stays live.
    phase: 'suspended',
  },
  {
    id: 'corporate-noir',
    label: 'Noir',
    // 2026-10-15: moved off Illustrious, which read as Western Cartoon again.
    checkpoint: 'Krea 2',
    blurb: 'Krea 2. Black-and-white film noir: hard shadows, smoke and rain.',
    mood: 'Black-and-white 1940s film noir stills: low-key light, venetian-blind shadows, smoke haze and silver grain.',
    phase: 'available',
  },
] as const

// Silas, 2026-10-14, after playing both: "the new art is actually worse than
// the classic. classic should be default."
export const DEFAULT_ART_STYLE = 'classic'
export const SELECTABLE_ART_STYLES = ART_STYLES.filter(
  (style) => style.phase === 'available',
)
// The same card in every edition, so the picker compares like with like.
// 2026-11-02: moved off gus-shop-steward, whose Western Cartoon render is a
// woman with antennae rather than Gus (see WITHDRAWN_RENDERS).
export const ART_STYLE_SAMPLE =
  '/images/shifting-desks/cards/orientation/the-guard-who-is-also-you.webp'

export type ShiftingDesksArtStyle = (typeof ART_STYLES)[number]['id']
// v3: v2 visitors were saved on Western Cartoon while it was the default.
export const ART_STYLE_STORAGE_KEY = 'shifting-desks-art-style-v3'

export function normalizeArtStyle(value: unknown): ShiftingDesksArtStyle {
  return SELECTABLE_ART_STYLES.find((s) => s.id === value)?.id ?? DEFAULT_ART_STYLE
}

// Renders pulled from a style after review (they show Classic instead) until
// a corrected render replaces them. Paths are relative to /images/shifting-desks/.
export const WITHDRAWN_RENDERS: Record<string, readonly string[]> = {
  // 2026-10-14: the Western Cartoon render shows explicit nudity.
  // 2026-11-02 (Silas: "that is not a cockroach"): the Illustrious checkpoint
  // drew the Roach Union as humans with antennae. Classic keeps the roaches.
  'western-cartoon': [
    // 2026-11-12: actual round-18 media review found these eleven finale
    // images fail their defining payoff composition. Keep the reviewed
    // Classic ending plates while corrected renders are curated.
    'endings/employee-of-the-month.webp',
    'endings/promoted-to-management.webp',
    'endings/escape-through-the-ducts.webp',
    'endings/roach-union-general-strike.webp',
    'endings/society-coup.webp',
    'endings/whistleblower.webp',
    'endings/early-retirement.webp',
    'endings/the-kind-rewrite.webp',
    'endings/position-eliminated.webp',
    'endings/posthumous-affairs.webp',
    'endings/permanent-adjournment.webp',
    'cards/records/the-jam-in-tube-14.webp',
    'cards/toy-division/the-union-walkthrough.webp',
    'cards/toy-division/gus-in-a-beanie.webp',
    'cards/orientation/gus-shop-steward.webp',
    'cards/orientation/refreshments-are-served.webp',
    'cards/orientation/gus-files-a-grievance.webp',
    'cards/orientation/fumigation-thursday.webp',
    'cards/wellness/the-spotless-plate-initiative.webp',
    'cards/sub-level-zero/gus-in-a-borrowed-suit.webp',
    'cards/records/the-union-archive.webp',
    'cards/records/flawless-paperwork.webp',
    'cards/records/gus-measures-the-glass.webp',
  ],
  // 2026-11-02: these Noir renders lost the roach the card is about.
  'corporate-noir': [
    'cards/toy-division/the-union-walkthrough.webp',
    'cards/wellness/the-spotless-plate-initiative.webp',
    'cards/sub-level-zero/gus-in-a-borrowed-suit.webp',
    'cards/records/flawless-paperwork.webp',
  ],
}

/** A stable, separate namespace so Classic assets can never be overwritten. */
export function artStyleImageSrc(baseSrc: string, style: unknown): string {
  const selected = normalizeArtStyle(style)
  const relative = baseSrc.replace('/images/shifting-desks/', '')
  if (WITHDRAWN_RENDERS[selected]?.includes(relative)) return baseSrc
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
