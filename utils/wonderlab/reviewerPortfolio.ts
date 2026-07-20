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

export type WonderLabPortfolioRepresentationGapReason =
  | 'NO_RESPONSIBLE_AFFINITY'
  | 'INSUFFICIENT_RESPONSIBLE_MATCHES'
  | 'PORTFOLIO_CAPACITY'

export type WonderLabPortfolioRepresentationGap = {
  reviewerKey: string
  kind: 'BOT' | 'CHARACTER'
  id: number
  name: string
  count: number
  target: number
  deficit: number
  bestScore: number | null
  responsibleExhibitCount: number
  reason: WonderLabPortfolioRepresentationGapReason
}

export type WonderLabPortfolioRepresentationSummary = {
  targetPerReviewer: number
  minimumScore: number
  eligibleReviewers: number
  representedReviewers: number
  meetingTargetReviewers: number
  underrepresentedReviewers: WonderLabPortfolioRepresentationGap[]
}

export type AssignWonderLabReviewerPortfolioOptions = {
  reviewersPerExhibit?: number
  diversityPenalty?: number
  assignmentMinimumScore?: number
  minimumAssignmentsPerReviewer?: number
  representationMinimumScore?: number
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

type CandidatePlacement = {
  exhibit: WonderLabPortfolioExhibit
  candidate: WonderLabPortfolioCandidate
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

function stableReviewerOrder(
  left: WonderLabPortfolioCandidate,
  right: WonderLabPortfolioCandidate,
): number {
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

function withRepresentationReason(
  candidate: WonderLabPortfolioCandidate,
  assignmentNumber: number,
  target: number,
): WonderLabPortfolioCandidate {
  return {
    ...candidate,
    reasons: [
      ...candidate.reasons,
      `cast representation floor: assignment ${assignmentNumber} of ${target}`,
    ],
  }
}

function placementOrder(
  selected: Map<number, WonderLabPortfolioCandidate[]>,
  left: CandidatePlacement,
  right: CandidatePlacement,
): number {
  if (right.candidate.score !== left.candidate.score) {
    return right.candidate.score - left.candidate.score
  }

  const leftSelected = selected.get(left.exhibit.key) || []
  const rightSelected = selected.get(right.exhibit.key) || []
  const leftContrast = leftSelected.some(
    (entry) => entry.reviewer.kind !== left.candidate.reviewer.kind,
  )
  const rightContrast = rightSelected.some(
    (entry) => entry.reviewer.kind !== right.candidate.reviewer.kind,
  )

  return (
    Number(rightContrast) - Number(leftContrast) ||
    leftSelected.length - rightSelected.length ||
    left.exhibit.key - right.exhibit.key
  )
}

export function assignWonderLabReviewerPortfolio(
  exhibits: WonderLabPortfolioExhibit[],
  options: AssignWonderLabReviewerPortfolioOptions = {},
): {
  assignments: WonderLabPortfolioAssignment[]
  reviewerUsage: WonderLabPortfolioReviewerUsage[]
  representation: WonderLabPortfolioRepresentationSummary
} {
  const reviewerCount = Math.max(
    1,
    Math.min(2, Math.round(options.reviewersPerExhibit ?? 2)),
  )
  const diversityPenalty = Math.max(0, options.diversityPenalty ?? 4)
  const assignmentMinimumScore = options.assignmentMinimumScore ?? 0
  const representationTarget = Math.max(
    0,
    Math.min(2, Math.round(options.minimumAssignmentsPerReviewer ?? 1)),
  )
  const representationMinimumScore = options.representationMinimumScore ?? 1
  const usage = new Map<string, number>()
  const selected = new Map<number, WonderLabPortfolioCandidate[]>()
  const candidatesByKey = new Map<string, WonderLabPortfolioCandidate>()
  const voiceReadyReviewerKeys = new Set<string>()
  const responsiblePlacements = new Map<string, CandidatePlacement[]>()

  for (const exhibit of exhibits) {
    for (const candidate of exhibit.candidates) {
      if (!candidatesByKey.has(candidate.reviewerKey)) {
        candidatesByKey.set(candidate.reviewerKey, candidate)
      }
      if (!candidate.voiceReady) continue
      voiceReadyReviewerKeys.add(candidate.reviewerKey)
      if (candidate.score < representationMinimumScore) continue
      const placements = responsiblePlacements.get(candidate.reviewerKey) || []
      placements.push({ exhibit, candidate })
      responsiblePlacements.set(candidate.reviewerKey, placements)
    }
  }

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

  // Reserve responsible placements for the eligible cast before broad reviewers
  // consume the portfolio. This is a domain-neutral representation floor: the
  // caller defines eligibility and affinity, while this utility only allocates
  // bounded slots without displacing existing editorial work.
  const representationOrder = [...voiceReadyReviewerKeys]
    .map((reviewerKey) => {
      const candidate = candidatesByKey.get(reviewerKey)
      if (!candidate) throw new Error(`Missing reviewer candidate for ${reviewerKey}.`)
      const placements = responsiblePlacements.get(reviewerKey) || []
      const bestScore = placements.length
        ? Math.max(...placements.map((placement) => placement.candidate.score))
        : Number.NEGATIVE_INFINITY
      return { reviewerKey, candidate, placements, bestScore }
    })
    .sort((left, right) =>
      left.placements.length - right.placements.length ||
      right.bestScore - left.bestScore ||
      stableReviewerOrder(left.candidate, right.candidate),
    )

  for (let round = 1; round <= representationTarget; round += 1) {
    for (const entry of representationOrder) {
      const currentUsage = usage.get(entry.reviewerKey) || 0
      if (currentUsage >= round) continue

      const available = entry.placements
        .filter(({ exhibit }) => {
          const reviewers = selected.get(exhibit.key) || []
          return (
            reviewers.length < reviewerCount &&
            !reviewers.some((reviewer) => reviewer.reviewerKey === entry.reviewerKey)
          )
        })
        .sort((left, right) => placementOrder(selected, left, right))

      const placement = available[0]
      if (!placement) continue
      const reviewers = selected.get(placement.exhibit.key) || []
      reviewers.push(
        withRepresentationReason(placement.candidate, currentUsage + 1, representationTarget),
      )
      selected.set(placement.exhibit.key, reviewers)
      usage.set(entry.reviewerKey, currentUsage + 1)
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
          candidate.score >= assignmentMinimumScore &&
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
          candidate.score >= assignmentMinimumScore &&
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

  const reviewerKeys = new Set([...voiceReadyReviewerKeys, ...usage.keys()])
  const reviewerUsage = [...reviewerKeys]
    .map((reviewerKey): WonderLabPortfolioReviewerUsage => {
      const candidate = candidatesByKey.get(reviewerKey)
      if (!candidate) throw new Error(`Missing reviewer candidate for ${reviewerKey}.`)
      return {
        reviewerKey,
        kind: candidate.reviewer.kind,
        id: candidate.reviewer.id,
        name: candidate.reviewer.name,
        count: usage.get(reviewerKey) || 0,
      }
    })
    .sort((left, right) =>
      right.count - left.count ||
      left.kind.localeCompare(right.kind, 'en') ||
      left.name.localeCompare(right.name, 'en') ||
      left.id - right.id,
    )

  const underrepresentedReviewers = representationOrder
    .filter((entry) => (usage.get(entry.reviewerKey) || 0) < representationTarget)
    .map((entry): WonderLabPortfolioRepresentationGap => {
      const count = usage.get(entry.reviewerKey) || 0
      const responsibleExhibitCount = entry.placements.length
      const bestScore = responsibleExhibitCount > 0 ? entry.bestScore : null
      const reason: WonderLabPortfolioRepresentationGapReason =
        responsibleExhibitCount === 0
          ? 'NO_RESPONSIBLE_AFFINITY'
          : responsibleExhibitCount < representationTarget
            ? 'INSUFFICIENT_RESPONSIBLE_MATCHES'
            : 'PORTFOLIO_CAPACITY'
      return {
        reviewerKey: entry.reviewerKey,
        kind: entry.candidate.reviewer.kind,
        id: entry.candidate.reviewer.id,
        name: entry.candidate.reviewer.name,
        count,
        target: representationTarget,
        deficit: representationTarget - count,
        bestScore,
        responsibleExhibitCount,
        reason,
      }
    })
    .sort((left, right) =>
      right.deficit - left.deficit ||
      left.reason.localeCompare(right.reason, 'en') ||
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
    representation: {
      targetPerReviewer: representationTarget,
      minimumScore: representationMinimumScore,
      eligibleReviewers: representationOrder.length,
      representedReviewers: representationOrder.filter(
        (entry) => (usage.get(entry.reviewerKey) || 0) > 0,
      ).length,
      meetingTargetReviewers: representationOrder.filter(
        (entry) => (usage.get(entry.reviewerKey) || 0) >= representationTarget,
      ).length,
      underrepresentedReviewers,
    },
  }
}
