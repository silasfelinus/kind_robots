// /server/api/admin/wonderlab/review-drafts/generate-batch.post.ts
import { createError, defineEventHandler, H3Error, readBody } from 'h3'
import { requireAdminApiUser } from '@/server/utils/authGuard'
import { errorHandler } from '@/server/utils/error'
import { generateWonderLabReviewDraft } from '@/server/utils/wonderLabReviewDraftGenerator'
import {
  buildWonderLabReviewPlan,
  type WonderLabReviewPlanReviewer,
} from '@/server/utils/wonderLabReviewPlan'

const MAX_BATCH_COMPONENTS = 10
const MAX_BATCH_GENERATIONS = 20

type GenerateBatchBody = {
  componentIds?: unknown
  limit?: unknown
  reviewersPerComponent?: unknown
  minimumScore?: unknown
  model?: unknown
  regenerate?: unknown
  dryRun?: unknown
}

type BatchTarget = {
  componentId: number
  componentName: string
  reviewer: WonderLabReviewPlanReviewer
}

function integerValue(
  value: unknown,
  options: { minimum: number; maximum: number; fallback: number; field: string },
): number {
  if (value === undefined || value === null || value === '') return options.fallback
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < options.minimum || parsed > options.maximum) {
    throw createError({
      statusCode: 400,
      message: `${options.field} must be an integer from ${options.minimum} to ${options.maximum}.`,
    })
  }
  return parsed
}

function numberValue(
  value: unknown,
  options: { minimum: number; maximum: number; fallback: number; field: string },
): number {
  if (value === undefined || value === null || value === '') return options.fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < options.minimum || parsed > options.maximum) {
    throw createError({
      statusCode: 400,
      message: `${options.field} must be a number from ${options.minimum} to ${options.maximum}.`,
    })
  }
  return parsed
}

function booleanValue(value: unknown, fallback: boolean, field: string): boolean {
  if (value === undefined || value === null) return fallback
  if (typeof value !== 'boolean') {
    throw createError({ statusCode: 400, message: `${field} must be boolean.` })
  }
  return value
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

  const unique = [...new Set(ids)]
  if (unique.length > MAX_BATCH_COMPONENTS) {
    throw createError({
      statusCode: 400,
      message: `A batch may include at most ${MAX_BATCH_COMPONENTS} Components.`,
    })
  }
  return unique
}

function generationTargets(
  plan: Awaited<ReturnType<typeof buildWonderLabReviewPlan>>,
  regenerate: boolean,
): BatchTarget[] {
  return plan.exhibits
    .flatMap((exhibit) =>
      exhibit.reviewers.map((reviewer) => ({
        componentId: exhibit.componentId,
        componentName: exhibit.title || exhibit.componentName,
        reviewer,
      })),
    )
    .filter((target) => {
      if (target.reviewer.coverage === 'PUBLISHED') return false
      if (regenerate) return true
      return target.reviewer.coverage === 'MISSING'
    })
    .slice(0, MAX_BATCH_GENERATIONS)
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireAdminApiUser(event)
    const body = await readBody<GenerateBatchBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({ statusCode: 400, message: 'Batch generation payload is required.' })
    }

    const ids = componentIds(body.componentIds)
    const limit = integerValue(body.limit, {
      minimum: 1,
      maximum: MAX_BATCH_COMPONENTS,
      fallback: MAX_BATCH_COMPONENTS,
      field: 'limit',
    })
    const reviewersPerComponent = integerValue(body.reviewersPerComponent, {
      minimum: 1,
      maximum: 2,
      fallback: 2,
      field: 'reviewersPerComponent',
    })
    const minimumScore = numberValue(body.minimumScore, {
      minimum: -100,
      maximum: 500,
      fallback: 0,
      field: 'minimumScore',
    })
    const regenerate = booleanValue(body.regenerate, false, 'regenerate')
    const dryRun = booleanValue(body.dryRun, true, 'dryRun')

    if (body.model !== undefined && typeof body.model !== 'string') {
      throw createError({ statusCode: 400, message: 'model must be a string.' })
    }
    const model = typeof body.model === 'string' ? body.model.trim() || null : null

    const plan = await buildWonderLabReviewPlan({
      componentIds: ids,
      limit,
      reviewersPerComponent,
      minimumScore,
    })
    const targets = generationTargets(plan, regenerate)

    if (dryRun) {
      return {
        success: true,
        data: {
          dryRun: true,
          plan,
          targetCount: targets.length,
          targets,
          generated: [],
        },
        message: `Dry run planned ${targets.length} generation(s); no model calls or writes were made.`,
      }
    }

    const generated: Array<{
      componentId: number
      reviewer: WonderLabReviewPlanReviewer
      success: boolean
      draftId: number | null
      status: string | null
      message: string
    }> = []

    // Intentionally sequential: keeps provider pressure bounded and produces a
    // reviewable result for every requested slot instead of failing the whole batch.
    for (const target of targets) {
      try {
        const result = await generateWonderLabReviewDraft({
          componentId: target.componentId,
          author: target.reviewer.author,
          actorUserId: auth.user.id,
          model,
          regenerate,
        })
        generated.push({
          componentId: target.componentId,
          reviewer: target.reviewer,
          success: true,
          draftId: result.draft.id,
          status: result.draft.status,
          message: result.reused
            ? 'Existing draft reused.'
            : result.draft.status === 'FAILED'
              ? 'Generated draft held for curator review.'
              : 'Proposed draft generated.',
        })
      } catch (error) {
        generated.push({
          componentId: target.componentId,
          reviewer: target.reviewer,
          success: false,
          draftId: null,
          status: null,
          message: error instanceof Error ? error.message : 'Generation failed.',
        })
      }
    }

    const succeeded = generated.filter((result) => result.success).length
    return {
      success: true,
      data: {
        dryRun: false,
        plan,
        targetCount: targets.length,
        targets,
        generated,
      },
      message: `Completed ${succeeded} of ${generated.length} planned generation(s). No drafts were approved or published.`,
    }
  } catch (error) {
    if (error instanceof H3Error) throw error
    return errorHandler(error)
  }
})
