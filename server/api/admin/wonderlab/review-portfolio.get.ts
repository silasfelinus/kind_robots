import { createError, defineEventHandler, getQuery, H3Error } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { buildWonderLabReviewPortfolio } from '@/server/utils/wonderLabReviewPortfolio'

function integerQuery(
  value: unknown,
  options: { minimum: number; maximum: number; fallback: number },
): number {
  if (value === undefined || value === null || value === '') return options.fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < options.minimum || parsed > options.maximum) {
    throw createError({
      statusCode: 400,
      message: `Expected an integer from ${options.minimum} to ${options.maximum}.`,
    })
  }
  return parsed
}

function numberQuery(
  value: unknown,
  options: { minimum: number; maximum: number; fallback: number },
): number {
  if (value === undefined || value === null || value === '') return options.fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < options.minimum || parsed > options.maximum) {
    throw createError({
      statusCode: 400,
      message: `Expected a number from ${options.minimum} to ${options.maximum}.`,
    })
  }
  return parsed
}

function componentIds(value: unknown): number[] {
  if (value === undefined || value === null || value === '') return []
  const values = Array.isArray(value) ? value : String(value).split(',')
  const ids = values
    .flatMap((item) => String(item).split(','))
    .map((item) => Number(item.trim()))

  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw createError({ statusCode: 400, message: 'componentIds must contain positive integers.' })
  }

  return [...new Set(ids)].slice(0, 500)
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const query = getQuery(event)

    const plan = await buildWonderLabReviewPortfolio({
      componentIds: componentIds(query.componentIds ?? query.componentId),
      limit: integerQuery(query.limit, { minimum: 1, maximum: 500, fallback: 500 }),
      reviewersPerComponent: integerQuery(query.reviewersPerComponent, {
        minimum: 1,
        maximum: 2,
        fallback: 2,
      }),
      minimumScore: numberQuery(query.minimumScore, {
        minimum: -100,
        maximum: 500,
        fallback: 0,
      }),
      diversityPenalty: numberQuery(query.diversityPenalty, {
        minimum: 0,
        maximum: 20,
        fallback: 4,
      }),
      minimumAssignmentsPerReviewer: integerQuery(query.minimumAssignmentsPerReviewer, {
        minimum: 0,
        maximum: 2,
        fallback: 2,
      }),
      representationMinimumScore: numberQuery(query.representationMinimumScore, {
        minimum: -100,
        maximum: 500,
        fallback: 1,
      }),
    })

    return {
      success: true,
      data: plan,
      message: `Portfolio-planned ${plan.reviewerSlots} reviewer slot(s) across ${plan.componentCount} exhibit(s); ${plan.representation.meetingTargetReviewers}/${plan.representation.eligibleReviewers} eligible reviewers meet the cast target.`,
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
