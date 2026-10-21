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
