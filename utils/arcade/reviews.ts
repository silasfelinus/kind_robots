import type { ArcadeGameMeta } from './types'

export type ArcadeRatingSummary = { average: number; count: number }
export type ArcadeRatingSummaryMap = Record<string, ArcadeRatingSummary>
export const ARCADE_COMMENT_MAX = 2000

export function validArcadeReview(value: unknown): value is { rating: number; comment?: string } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const input = value as Record<string, unknown>
  return Number.isInteger(input.rating) && Number(input.rating) >= 1 &&
    Number(input.rating) <= 5 &&
    (input.comment === undefined || (typeof input.comment === 'string' && input.comment.trim().length <= ARCADE_COMMENT_MAX))
}

export function sortArcadeGamesByRating(
  games: readonly ArcadeGameMeta[],
  summaries: ArcadeRatingSummaryMap,
): ArcadeGameMeta[] {
  return [...games].sort((a, b) => {
    const ar = summaries[a.slug]
    const br = summaries[b.slug]
    const aRated = (ar?.count ?? 0) > 0
    const bRated = (br?.count ?? 0) > 0
    if (aRated !== bRated) return aRated ? -1 : 1
    if (aRated && bRated) {
      const diff = br.average - ar.average || br.count - ar.count
      if (diff) return diff
    }
    return a.title.localeCompare(b.title)
  })
}
