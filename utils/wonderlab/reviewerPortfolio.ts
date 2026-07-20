import type {
  WonderLabReviewerAffinity,
  WonderLabReviewerCandidate,
} from './reviewerAffinity'
import type { ReviewDraftStatus } from './reviewDraft'

export type WonderLabPortfolioCoverage = 'MISSING' | 'DRAFTED' | 'PUBLISHED'

export type WonderLabPortfolioCandidate = WonderLabReviewerAffinity & {
  coverage: WonderLabPortfolioCoverage
}

export type WonderLabPortfolioExhibit = {
  key: number
  candidates: WonderLabPortfolioCandidate[]
}

export type WonderLabPortfolioAssignment = {
  key: number
  reviewers: WonderLabPortfolioCandidate[]
}

export type WonderLabPortfolioReviewerUsage = {
  reviewerKey: string
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  count: number
}

export type AssignWonderLabReviewerPortfolioOptions = {
  reviewersPerExhibit?: number
  diversityPenalty?: number
}

const ACTIVE_EDITORIAL_DRAFT_STATUSES = new Set<ReviewDraftStatus>([
  'PROPOSED',
  'APPROVED',
])

export function isWonderLabActiveEditorialDraft(
  status: ReviewDraftStatus,
): boolean {
  return ACTIVE_EDITORIAL_DRAFT_STATUSES.has(status)
}

const COVERAGE_PRIORITY: Record<WonderLabPortfolioCoverage, number> = {
  PUBLISHED: 0,
  DRAFTED: 1,
  MISSING: 2,
}

function normalizedReviewerName(value: string | null | undefined): string {
  return String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function isWonderLabEditoriallyExcludedReviewer(
  candidate: Pick<WonderLabReviewerCandidate, 'name' | 'slug'>,
): boolean {
  return (
    normalizedReviewerName(candidate.name) === 'princess-donut' ||
    normalizedReviewerName(candidate.slug) === 'princess-donut'
  )
}

function stableCandidateOrder(
  left: WonderLabPortfolioCandidate,
  right: WonderLabPortfolioCandidate,
): number {
  if (right.score !== left.score) return right.score - left.score
  if (left.reviewer.kind !== right.reviewer.kind) {
    return left.reviewer.kind.localeCompare(right.reviewer.kind, 'en')
  }
  const nameOrder = left.reviewer.name.localeCompare(right.reviewer.name, 'en')
  return nameOrder || left.reviewer.id - right.reviewer.id
}

function pinnedCandidateOrder(
  left: WonderLabPortfolioCandidate,
  right: WonderLabPortfolioCandidate,
): number {
  const coverageOrder = COVERAGE_PRIORITY[left.coverage] - COVERAGE_PRIORITY[right.coverage]
  return coverageOrder || stableCandidateOrder(left, right)
}

function withPortfolioReason(
  candidate: WonderLabPortfolioCandidate,
  priorAssignments: number,
): WonderLabPortfolioCandidate {
  if (priorAssignments <= 0) return candidate
  return {
    ...candidate,
    reasons: [
      ...candidate.reasons,
      `portfolio balance: ${priorAssignments} prior planned assignment${priorAssignments === 1 ? '' : 's'}`,
    ],
  }
}

export function assignWonderLabReviewerPortfolio(
  exhibits: WonderLabPortfolioExhibit[],
  options: AssignWonderLabReviewerPortfolioOptions = {},
): {
  assignments: WonderLabPortfolioAssignment[]
  reviewerUsage: WonderLabPortfolioReviewerUsage[]
} {
  const reviewerCount = Math.max(
    1,
    Math.min(2, Math.round(options.reviewersPerExhibit ?? 2)),
  )
  const diversityPenalty = Math.max(0, options.diversityPenalty ?? 4)
  const usage = new Map<string, number>()
  const selected = new Map<number, WonderLabPortfolioCandidate[]>()

  // Existing editorial work is stable: preserve published and drafted slots before
  // balancing new assignments. Published work wins when more historical slots exist
  // than the current plan requests.
  for (const exhibit of exhibits) {
    const pinned = exhibit.candidates
      .filter((candidate) => candidate.coverage !== 'MISSING')
      .sort(pinnedCandidateOrder)
      .slice(0, reviewerCount)

    selected.set(exhibit.key, [...pinned])
    for (const candidate of pinned) {
      usage.set(candidate.reviewerKey, (usage.get(candidate.reviewerKey) || 0) + 1)
    }
  }

  // Plan high-affinity and constrained exhibits first. New selections pay a
  // deterministic repeat-use penalty so a generic voice cannot dominate the museum.
  const fillOrder = exhibits
    .map((exhibit) => {
      const alreadySelected = selected.get(exhibit.key) || []
      const available = exhibit.candidates.filter(
        (candidate) =>
          candidate.voiceReady &&
          !alreadySelected.some((entry) => entry.reviewerKey === candidate.reviewerKey),
      )
      return {
        exhibit,
        bestScore: available.length
          ? Math.max(...available.map((candidate) => candidate.score))
          : Number.NEGATIVE_INFINITY,
        availableCount: available.length,
      }
    })
    .sort((left, right) =>
      right.bestScore - left.bestScore ||
      left.availableCount - right.availableCount ||
      left.exhibit.key - right.exhibit.key,
    )

  for (const { exhibit } of fillOrder) {
    const reviewers = selected.get(exhibit.key) || []

    while (reviewers.length < reviewerCount) {
      let pool = exhibit.candidates.filter(
        (candidate) =>
          candidate.voiceReady &&
          !reviewers.some((entry) => entry.reviewerKey === candidate.reviewerKey),
      )
      if (!pool.length) break

      // When two voices are requested, prefer a Bot/Character contrast whenever
      // the exhibit has any eligible opposite-kind candidate.
      const first = reviewers[0]
      if (first) {
        const contrasting = pool.filter(
          (candidate) => candidate.reviewer.kind !== first.reviewer.kind,
        )
        if (contrasting.length) pool = contrasting
      }

      pool.sort((left, right) => {
        const leftUsage = usage.get(left.reviewerKey) || 0
        const rightUsage = usage.get(right.reviewerKey) || 0
        const leftAdjusted = left.score - leftUsage * diversityPenalty
        const rightAdjusted = right.score - rightUsage * diversityPenalty
        return (
          rightAdjusted - leftAdjusted ||
          leftUsage - rightUsage ||
          stableCandidateOrder(left, right)
        )
      })

      const choice = pool[0]
      if (!choice) break
      const priorAssignments = usage.get(choice.reviewerKey) || 0
      reviewers.push(withPortfolioReason(choice, priorAssignments))
      usage.set(choice.reviewerKey, priorAssignments + 1)
    }

    selected.set(exhibit.key, reviewers)
  }

  const candidatesByKey = new Map<string, WonderLabPortfolioCandidate>()
  for (const exhibit of exhibits) {
    for (const candidate of exhibit.candidates) {
      if (!candidatesByKey.has(candidate.reviewerKey)) {
        candidatesByKey.set(candidate.reviewerKey, candidate)
      }
    }
  }

  const reviewerUsage = [...usage.entries()]
    .map(([reviewerKey, count]): WonderLabPortfolioReviewerUsage => {
      const candidate = candidatesByKey.get(reviewerKey)
      if (!candidate) throw new Error(`Missing reviewer candidate for ${reviewerKey}.`)
      return {
        reviewerKey,
        kind: candidate.reviewer.kind,
        id: candidate.reviewer.id,
        name: candidate.reviewer.name,
        count,
      }
    })
    .sort((left, right) =>
      right.count - left.count ||
      left.kind.localeCompare(right.kind, 'en') ||
      left.name.localeCompare(right.name, 'en') ||
      left.id - right.id,
    )

  return {
    assignments: exhibits.map((exhibit) => ({
      key: exhibit.key,
      reviewers: selected.get(exhibit.key) || [],
    })),
    reviewerUsage,
  }
}
