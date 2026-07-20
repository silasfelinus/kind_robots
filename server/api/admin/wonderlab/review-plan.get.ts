// /server/api/admin/wonderlab/review-plan.get.ts
import { createError, defineEventHandler, getQuery, H3Error } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { buildWonderLabReviewBatchPlan } from '@/server/utils/wonderLabReviewBatchPlan'

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

  return [...new Set(ids)].slice(0, 100)
}

export default defineEventHandler(async (event) => {
  try {
    await requireAdminApiUser(event)
    const query = getQuery(event)

    const plan = await buildWonderLabReviewBatchPlan({
      componentIds: componentIds(query.componentIds ?? query.componentId),
      limit: integerQuery(query.limit, { minimum: 1, maximum: 100, fallback: 25 }),
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
    })

    return {
      success: true,
      data: plan,
      message: `Selected ${plan.reviewerSlots} globally portfolio-planned reviewer slot(s) across ${plan.componentCount} exhibit(s).`,
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
