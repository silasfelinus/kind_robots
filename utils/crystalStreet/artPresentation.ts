import type { EndingTier, SpecialEnding } from './types'

// Already delivered generated location painting, not a code-drawn placeholder.
export const CRYSTAL_STREET_TOWN_PAINTING =
  '/crystal-street/locations/crystal-street.webp'

export function weekEndingArt(entry: {
  villain: string
  tier: EndingTier
  special?: SpecialEnding
}): string {
  const key =
    entry.special && entry.special !== 'final-girl'
      ? `special-${entry.special}`
      : `${entry.villain}-${entry.tier}`
  return `/crystal-street/endings/${key}.webp`
}
