// /server/api/model-builder/runs/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import { Prisma } from '~/prisma/generated/prisma/client'
import type { ModelBuildAction } from '~/prisma/generated/prisma/client'
import prisma from '~/server/utils/prisma'
import { errorHandler } from '~/server/utils/error'
import { requireApiUser } from '~/server/utils/authGuard'
import { runInclude } from './index'

const actions = new Set<ModelBuildAction>(['CREATE', 'UPDATE', 'ASSET_ONLY'])

type RunItemInput = {
  outputKey?: unknown
  label?: unknown
  action?: unknown
  generation?: unknown
  quantityIndex?: unknown
  stageStatuses?: unknown
  pitch?: unknown
  fieldsDraft?: unknown
  promptDraft?: unknown
}

type RunCreateBody = {
  sourceType?: unknown
  sourceId?: unknown
  sourceLabel?: unknown
  sourceSnapshot?: unknown
  recipeKey?: unknown
  recipeVersion?: unknown
  selections?: unknown
  items?: unknown
}

function requiredString(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({ statusCode: 400, message: `"${field}" is required.` })
  }
  if (value.length > max) {
    throw createError({
      statusCode: 400,
      message: `"${field}" must be ${max} characters or fewer.`,
    })
  }
  return value.trim()
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const body = await readBody<RunCreateBody>(event)

    const sourceType = requiredString(body.sourceType, 'sourceType', 64)
    const recipeKey = requiredString(body.recipeKey, 'recipeKey', 64)

    const sourceId = Number(body.sourceId)
    if (!Number.isInteger(sourceId) || sourceId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid sourceId is required.',
      })
    }

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw createError({
        statusCode: 400,
        message: 'At least one build item is required.',
      })
    }

    const items = (body.items as RunItemInput[]).map((item, index) => {
      const outputKey = requiredString(item.outputKey, `items[${index}].outputKey`, 64)
      const generation = requiredString(
        item.generation,
        `items[${index}].generation`,
        32,
      )
      const action = actions.has(item.action as ModelBuildAction)
        ? (item.action as ModelBuildAction)
        : 'ASSET_ONLY'
      const stageStatuses =
        item.stageStatuses && typeof item.stageStatuses === 'object'
          ? (item.stageStatuses as Prisma.InputJsonValue)
          : ({} as Prisma.InputJsonValue)

      const text = (value: unknown): string | null =>
        typeof value === 'string' && value.trim() ? value : null

      return {
        outputKey,
        label:
          typeof item.label === 'string' ? item.label.slice(0, 255) : null,
        action,
        generation,
        quantityIndex:
          Number.isInteger(Number(item.quantityIndex)) &&
          Number(item.quantityIndex) >= 0
            ? Number(item.quantityIndex)
            : 0,
        stageStatuses,
        pitch: text(item.pitch),
        fieldsDraft: text(item.fieldsDraft),
        promptDraft: text(item.promptDraft),
      }
    })

    const run = await prisma.modelBuildRun.create({
      data: {
        userId: auth.user.id,
        status: 'ACTIVE',
        sourceType,
        sourceId,
        sourceLabel:
          typeof body.sourceLabel === 'string'
            ? body.sourceLabel.slice(0, 255)
            : null,
        sourceSnapshot:
          body.sourceSnapshot && typeof body.sourceSnapshot === 'object'
            ? (body.sourceSnapshot as Prisma.InputJsonValue)
            : undefined,
        recipeKey,
        recipeVersion:
          typeof body.recipeVersion === 'string'
            ? body.recipeVersion.slice(0, 32)
            : null,
        selections:
          body.selections && typeof body.selections === 'object'
            ? (body.selections as Prisma.InputJsonValue)
            : undefined,
        Items: { create: items },
      },
      include: runInclude,
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      message: 'Build run created successfully.',
      data: run,
      statusCode: 201,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode ?? 500
    event.node.res.statusCode = statusCode
    return { ...handled, statusCode }
  }
})
