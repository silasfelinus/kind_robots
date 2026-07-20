import {
  buildWonderLabReviewPortfolio,
  type WonderLabPortfolioRepresentationSummary,
} from '@/server/utils/wonderLabReviewPortfolio'
import type { WonderLabReviewPlan } from '@/server/utils/wonderLabReviewPlan'
import { selectWonderLabReviewPortfolioBatch } from '@/utils/wonderlab/reviewPortfolioBatch'

export const WONDERLAB_EDITORIAL_PORTFOLIO_POLICY = {
  diversityPenalty: 4,
  minimumAssignmentsPerReviewer: 2,
  representationMinimumScore: 1,
} as const

export type BuildWonderLabReviewBatchPlanOptions = {
  componentIds?: number[]
  limit?: number
  reviewersPerComponent?: number
  minimumScore?: number
}

export type WonderLabReviewBatchPlan = WonderLabReviewPlan & {
  assignmentMode: 'PORTFOLIO_DIVERSE'
  portfolio: {
    componentCount: number
    reviewerSlots: number
    missingCount: number
    draftedCount: number
    publishedCount: number
    diversityPenalty: number
    representationTarget: number
    representationMinimumScore: number
    representation: WonderLabPortfolioRepresentationSummary
  }
}

export async function buildWonderLabReviewBatchPlan(
  options: BuildWonderLabReviewBatchPlanOptions = {},
): Promise<WonderLabReviewBatchPlan> {
  const globalPortfolio = await buildWonderLabReviewPortfolio({
    limit: 500,
    reviewersPerComponent: options.reviewersPerComponent,
    minimumScore: options.minimumScore,
    ...WONDERLAB_EDITORIAL_PORTFOLIO_POLICY,
  })
  const exhibits = selectWonderLabReviewPortfolioBatch(globalPortfolio.exhibits, {
    componentIds: options.componentIds,
    limit: options.limit,
  })
  const reviewers = exhibits.flatMap((exhibit) => exhibit.reviewers)

  return {
    assignmentMode: globalPortfolio.assignmentMode,
    exhibits,
    componentCount: exhibits.length,
    reviewerSlots: reviewers.length,
    missingCount: reviewers.filter((reviewer) => reviewer.coverage === 'MISSING').length,
    draftedCount: reviewers.filter((reviewer) => reviewer.coverage === 'DRAFTED').length,
    publishedCount: reviewers.filter((reviewer) => reviewer.coverage === 'PUBLISHED').length,
    portfolio: {
      componentCount: globalPortfolio.componentCount,
      reviewerSlots: globalPortfolio.reviewerSlots,
      missingCount: globalPortfolio.missingCount,
      draftedCount: globalPortfolio.draftedCount,
      publishedCount: globalPortfolio.publishedCount,
      diversityPenalty: globalPortfolio.diversityPenalty,
      representationTarget: globalPortfolio.representationTarget,
      representationMinimumScore: globalPortfolio.representationMinimumScore,
      representation: globalPortfolio.representation,
    },
  }
}
