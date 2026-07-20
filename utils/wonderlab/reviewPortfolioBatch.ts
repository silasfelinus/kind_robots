export type WonderLabPortfolioBatchCoverage = 'MISSING' | 'DRAFTED' | 'PUBLISHED'

export type WonderLabPortfolioBatchReviewer = {
  coverage: WonderLabPortfolioBatchCoverage
  score: number
  reasons: string[]
}

export type WonderLabPortfolioBatchExhibit = {
  componentId: number
  reviewers: WonderLabPortfolioBatchReviewer[]
}

export type SelectWonderLabPortfolioBatchOptions = {
  componentIds?: number[]
  limit?: number
}

type ExhibitPriority = {
  representationMissing: number
  missing: number
  drafted: number
  bestMissingScore: number
}

function priority(exhibit: WonderLabPortfolioBatchExhibit): ExhibitPriority {
  const missingReviewers = exhibit.reviewers.filter(
    (reviewer) => reviewer.coverage === 'MISSING',
  )
  return {
    representationMissing: missingReviewers.filter((reviewer) =>
      reviewer.reasons.some((reason) => reason.startsWith('cast representation floor:')),
    ).length,
    missing: missingReviewers.length,
    drafted: exhibit.reviewers.filter((reviewer) => reviewer.coverage === 'DRAFTED').length,
    bestMissingScore: missingReviewers.length
      ? Math.max(...missingReviewers.map((reviewer) => reviewer.score))
      : Number.NEGATIVE_INFINITY,
  }
}

/**
 * Selects a bounded editorial batch from an already-computed global portfolio.
 *
 * Explicit IDs preserve caller order. Automatic selection gives first priority
 * to missing cast-representation placements, then other missing high-affinity
 * work. It never recalculates reviewer assignments from the small batch.
 */
export function selectWonderLabReviewPortfolioBatch<
  T extends WonderLabPortfolioBatchExhibit,
>(
  exhibits: readonly T[],
  options: SelectWonderLabPortfolioBatchOptions = {},
): T[] {
  const limit = Math.max(1, Math.floor(options.limit ?? 10))
  const requestedIds = [...new Set(options.componentIds || [])].filter(
    (id) => Number.isInteger(id) && id > 0,
  )

  if (requestedIds.length) {
    const byId = new Map(exhibits.map((exhibit) => [exhibit.componentId, exhibit]))
    return requestedIds
      .map((id) => byId.get(id))
      .filter((exhibit): exhibit is T => Boolean(exhibit))
  }

  return [...exhibits]
    .sort((left, right) => {
      const leftPriority = priority(left)
      const rightPriority = priority(right)
      return (
        rightPriority.representationMissing - leftPriority.representationMissing ||
        rightPriority.missing - leftPriority.missing ||
        leftPriority.drafted - rightPriority.drafted ||
        rightPriority.bestMissingScore - leftPriority.bestMissingScore ||
        left.componentId - right.componentId
      )
    })
    .slice(0, limit)
}
