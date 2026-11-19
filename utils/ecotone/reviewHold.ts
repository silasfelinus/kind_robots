/**
 * Internal publication hold, 2026-10-21. This is a presentation safeguard,
 * not a claim that a Wiyot Tribe consultation has occurred.
 *
 * WH-121 dramatizes the 1849 Gregg party without the Wiyot context; it is
 * withheld from playable draws pending sourced revision and cultural review.
 * Mara remains a playable, independently motivated fictional character, but
 * the unspecified reservation/grant biography and culturally coded portraits
 * are withheld. No approval can be inferred from publication of other content.
 *
 * This gate intentionally fails closed. Do not flip it from a query parameter
 * or save data. Removal requires a separate, documented review and owner signoff.
 */
export const ECOTONE_REVIEW_HELD_CARDS = ['WH-121'] as const

export function isEcotoneReviewHeldCard(id: unknown): boolean {
  return typeof id === 'string' && id.toUpperCase() === 'WH-121'
}

export function isEcotoneReviewHeldArt(asset: string): boolean {
  const key = asset.toLowerCase()
  return (
    key === 'companions/mara' ||
    key === 'encounters/wh-121-latitude-argument' ||
    key === 'cards/wh-121' ||
    key.startsWith('outcomes/wh-121/') ||
    key.startsWith('endings/mara-') ||
    // These opening illustrations portray Mara before her design is reviewed.
    key === 'cards/kn-1' ||
    key.startsWith('outcomes/kn-1/') ||
    // One Ecotopia variant contains an explicitly Native Californian portrait.
    key === 'endings/ecotopia-mdma-dark'
  )
}

/** Art review also contains legacy prompt prose with unidentified tribal cues. */
export function isEcotoneReviewHeldArtSubject(subject: {
  asset: string
  prompt: string
}): boolean {
  return (
    isEcotoneReviewHeldArt(subject.asset) ||
    /\b(?:wiyot|tuluwat|indian island|native californian|tribal|indigenous|reservation)\b/i.test(
      subject.prompt,
    )
  )
}

/**
 * Owner-approved replacements (Silas, 2026-11-19 PT: the withheld plates
 * "should be generated"). Each key below was re-rendered from a NEW Mara design:
 * a fictional, independent tattoo artist with no tribal, reservation or
 * culturally coded imagery (conductor projects/weird-humboldt/art/
 * REVIEWED-MARA-2026-11-19.yaml). The new files live at `reviewed/<key>`; the
 * original renders stay held above and are never served. WH-121 is excluded
 * content and is deliberately absent.
 */
export const ECOTONE_REVIEWED_ART: readonly string[] = [
  'companions/mara',
  'cards/kn-1',
  'outcomes/kn-1/pit-success',
  'outcomes/kn-1/flash-success',
  'endings/ecotopia-mdma-dark',
  ...['sober', 'tipsy', 'stoned', 'tripping_balls', 'cocaine', 'meth', 'mdma']
    .flatMap((lens) => [`${lens}-hope`, `${lens}-dark`])
    .map((ending) => `endings/mara-${ending}`),
]

/** The reviewed replacement key for a held picture, or null if it has none. */
export function ecotoneReviewedArtKey(asset: string): string | null {
  const key = asset.toLowerCase()
  return isEcotoneReviewHeldArt(key) && ECOTONE_REVIEWED_ART.includes(key)
    ? `reviewed/${key}`
    : null
}
