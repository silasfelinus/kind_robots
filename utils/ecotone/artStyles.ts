import { ECOTONE_ART, ECOTONE_ART_ROOT } from './content'

/**
 * Ecotone's art styles, the Shifting Desks way (conductor weird-humboldt
 * t-039, t-042). A style is presentation only: it never enters the run or the
 * save.
 *
 * Silas, 2026-10-20 PT, after the checkpoint review: "we should use nova
 * comix, krea2, arthemy, and z-image turbo should all have generation lanes".
 * Each of those four is a style with its own art lane (utils/playbook/
 * artLanes.ts), and Storybook keeps the code-drawn scenes.
 *
 * A checkpoint style keeps its renders under /ecotone/styles/<id>/ and lists
 * them in STYLE_RENDERS. Any picture it has not rendered yet falls back to the
 * shipped set at /ecotone/<asset>.webp, then to the drawn scene, so a style
 * can ship before its renders are done.
 */
export const ECOTONE_ART_STYLES = [
  {
    id: 'zimage',
    label: 'Painted',
    checkpoint: 'Z-Image Turbo',
    lane: 'zimage',
    blurb: 'Soft painted light, the county as it really looks.',
  },
  {
    id: 'krea2',
    label: 'Film Still',
    checkpoint: 'Krea 2',
    lane: 'krea2',
    blurb: 'Photographic grain, fog and practical light.',
  },
  {
    id: 'arthemy',
    label: 'Western Art',
    checkpoint: 'Arthemy Western Art',
    lane: 'arthemy',
    blurb: 'Bold illustrated color, poster drama.',
  },
  {
    id: 'novacomic',
    label: 'Comic',
    checkpoint: 'Nova Comic XL',
    lane: 'novacomic',
    blurb: 'Inked lines and comic-book color.',
  },
  {
    id: 'storybook',
    label: 'Storybook',
    checkpoint: null,
    lane: null,
    blurb: 'Flat drawn scenes: fog, redwoods, string lights and moonlight.',
  },
] as const

export type EcotoneArtStyle = (typeof ECOTONE_ART_STYLES)[number]['id']

export const DEFAULT_ECOTONE_ART_STYLE: EcotoneArtStyle = 'zimage'
export const ECOTONE_ART_STYLE_KEY = 'ecotone-art-style-v1'
/** Provide/inject key the board shares with every scene it draws. */
export const ECOTONE_ART_STYLE_INJECTION = 'ecotone-art-style'
/** The same picture in every style, so the picker compares like with like. */
export const ECOTONE_STYLE_SAMPLE = 'title/key-art'

/** Renders each extra style has shipped, by asset key (e.g. 'companions/kit'). */
export const STYLE_RENDERS: Partial<
  Record<EcotoneArtStyle, readonly string[]>
> = {}

/** Saved choices from before the checkpoint styles. */
const LEGACY_STYLES: Record<string, EcotoneArtStyle> = { painted: 'zimage' }

export function normalizeEcotoneArtStyle(value: unknown): EcotoneArtStyle {
  if (typeof value === 'string' && LEGACY_STYLES[value])
    return LEGACY_STYLES[value]
  return (
    ECOTONE_ART_STYLES.find((style) => style.id === value)?.id ??
    DEFAULT_ECOTONE_ART_STYLE
  )
}

/** Whether a style has its own render of this picture yet. */
export function styleHasRender(style: EcotoneArtStyle, asset: string): boolean {
  return Boolean(STYLE_RENDERS[style]?.includes(asset))
}

/**
 * The picture to lay over a drawn scene, or null to show the drawn scene.
 * Storybook never paints; a checkpoint style shows its own render, else the
 * shipped set.
 */
export function ecotoneArtSrc(
  asset: string | undefined,
  style: unknown,
): string | null {
  if (!asset || !ECOTONE_ART.includes(asset)) return null
  const selected = normalizeEcotoneArtStyle(style)
  if (selected === 'storybook') return null
  if (styleHasRender(selected, asset))
    return `${ECOTONE_ART_ROOT}styles/${selected}/${asset}.webp`
  return `${ECOTONE_ART_ROOT}${asset}.webp`
}

export function loadEcotoneArtStyle(): EcotoneArtStyle {
  try {
    return normalizeEcotoneArtStyle(localStorage.getItem(ECOTONE_ART_STYLE_KEY))
  } catch {
    return DEFAULT_ECOTONE_ART_STYLE
  }
}

export function saveEcotoneArtStyle(style: EcotoneArtStyle): void {
  try {
    localStorage.setItem(ECOTONE_ART_STYLE_KEY, style)
  } catch {
    // The game still plays without storage; the choice just won't persist.
  }
}
