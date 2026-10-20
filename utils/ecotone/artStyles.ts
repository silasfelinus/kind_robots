import { ECOTONE_ART, ECOTONE_ART_ROOT } from './content'

/**
 * Ecotone's art styles, the Shifting Desks way (conductor weird-humboldt
 * t-039). A style is presentation only: it never enters the run or the save.
 *
 * - Painted: the shipped paintings (the Z-Image house lane), with the drawn
 *   scene under every beat that has none.
 * - Storybook: the code-drawn scenes alone, the look of the 2026-10-20 mockups.
 *
 * A further style keeps its renders under /ecotone/styles/<id>/ and lists
 * them in STYLE_RENDERS. Any beat it has not drawn falls back to the Painted
 * art, then to the drawn scene, so a style can ship before it is complete.
 * Which checkpoints become styles is Silas's call after the bake-off review.
 */
export const ECOTONE_ART_STYLES = [
  {
    id: 'painted',
    label: 'Painted',
    checkpoint: 'Z-Image Turbo',
    blurb: 'Painted scenes and portraits over the drawn county.',
    phase: 'available',
  },
  {
    id: 'storybook',
    label: 'Storybook',
    checkpoint: null,
    blurb: 'Flat drawn scenes: fog, redwoods, string lights and moonlight.',
    phase: 'available',
  },
] as const

export type EcotoneArtStyle = (typeof ECOTONE_ART_STYLES)[number]['id']

export const DEFAULT_ECOTONE_ART_STYLE: EcotoneArtStyle = 'painted'
export const ECOTONE_ART_STYLE_KEY = 'ecotone-art-style-v1'
/** Provide/inject key the board shares with every scene it draws. */
export const ECOTONE_ART_STYLE_INJECTION = 'ecotone-art-style'
/** The same picture in every style, so the picker compares like with like. */
export const ECOTONE_STYLE_SAMPLE = 'title/key-art'

/** Renders each extra style has shipped, by asset key (e.g. 'companions/kit'). */
export const STYLE_RENDERS: Partial<
  Record<EcotoneArtStyle, readonly string[]>
> = {}

export function normalizeEcotoneArtStyle(value: unknown): EcotoneArtStyle {
  return (
    ECOTONE_ART_STYLES.find((style) => style.id === value)?.id ??
    DEFAULT_ECOTONE_ART_STYLE
  )
}

/**
 * The picture to lay over a drawn scene, or null to show the drawn scene.
 * Painted is the base; Storybook never paints; other styles fall back to it.
 */
export function ecotoneArtSrc(
  asset: string | undefined,
  style: unknown,
): string | null {
  if (!asset || !ECOTONE_ART.includes(asset)) return null
  const selected = normalizeEcotoneArtStyle(style)
  if (selected === 'storybook') return null
  if (STYLE_RENDERS[selected]?.includes(asset))
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
