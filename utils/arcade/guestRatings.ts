import type { ArcadeRatingSummaryMap } from './reviews'

export const GUEST_COMMENT_MAX = 280
export const GUEST_DAILY_LIMIT = 30
export const GUEST_TOKEN_PATTERN = /^[A-Za-z0-9-]{16,64}$/

export type GuestRatingInput = {
  rating: number
  comment?: string
  token: string
}

export function validGuestRating(value: unknown): value is GuestRatingInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const input = value as Record<string, unknown>
  return (
    Number.isInteger(input.rating) &&
    Number(input.rating) >= 1 &&
    Number(input.rating) <= 5 &&
    typeof input.token === 'string' &&
    GUEST_TOKEN_PATTERN.test(input.token) &&
    (input.comment === undefined ||
      (typeof input.comment === 'string' &&
        input.comment.trim().length <= GUEST_COMMENT_MAX))
  )
}

// Folds guest star totals into the signed-in summaries as one weighted mean.
export function mergeRatingSummaries(
  signedIn: ArcadeRatingSummaryMap,
  guests: ArcadeRatingSummaryMap,
): ArcadeRatingSummaryMap {
  const merged: ArcadeRatingSummaryMap = { ...signedIn }
  for (const [slug, guest] of Object.entries(guests)) {
    const own = merged[slug]
    if (!own || own.count === 0) {
      merged[slug] = guest
      continue
    }
    const count = own.count + guest.count
    merged[slug] = {
      count,
      average: (own.average * own.count + guest.average * guest.count) / count,
    }
  }
  return merged
}
