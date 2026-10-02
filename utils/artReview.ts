// /utils/artReview.ts
//
// One vocabulary for the Rebel Button's art-reviewer mode. The 1-5 star scale
// is stored on Reaction.rating and mapped onto the existing ReactionType enum so
// every other reaction surface reads a review as the reaction it already is.

export const ART_REVIEW_UNLOCK_CLICKS = 100
export const ART_REVIEW_COMMENT_MAX = 500

export const ART_REVIEW_RATINGS = [
  { rating: 1, label: 'Hate it', reactionType: 'HATED' },
  { rating: 2, label: 'Meh', reactionType: 'BOOED' },
  { rating: 3, label: 'Neutral', reactionType: 'NEUTRAL' },
  { rating: 4, label: 'Like it', reactionType: 'CLAPPED' },
  { rating: 5, label: 'Love it', reactionType: 'LOVED' },
] as const

export type ArtReviewRating = (typeof ART_REVIEW_RATINGS)[number]['rating']
export type ArtReviewReactionType =
  (typeof ART_REVIEW_RATINGS)[number]['reactionType']

export function isArtReviewRating(value: unknown): value is ArtReviewRating {
  return ART_REVIEW_RATINGS.some((entry) => entry.rating === value)
}

export function reactionTypeForRating(
  rating: ArtReviewRating,
): ArtReviewReactionType {
  return (
    ART_REVIEW_RATINGS.find((entry) => entry.rating === rating)?.reactionType ??
    'NEUTRAL'
  )
}

export type ArtReviewCandidate = {
  id: number
  src: string
  isMature: boolean
  isOwn: boolean
}

export type ArtReviewResult = {
  reactionId: number
  rating: ArtReviewRating
  firstReview: boolean
  clickRecord: number
  karma: number
  karmaAwarded: number
}
