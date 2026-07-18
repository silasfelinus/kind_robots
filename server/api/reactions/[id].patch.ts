// /server/api/reactions/[id].patch.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import { userIsAdmin } from '../../utils/authUser'
import {
  ReactionType,
  type Prisma,
} from '~/prisma/generated/prisma/client'

type ReactionPatchBody = {
  reactionType?: unknown
  comment?: unknown
  rating?: unknown
}

const allowedPatchFields = new Set(['reactionType', 'comment', 'rating'])
const validReactionTypes = Object.values(ReactionType)

function normalizeReactionType(value: unknown): ReactionType {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"reactionType" must be a string.',
    })
  }

  const normalized = value.trim().toUpperCase() as ReactionType

  if (!validReactionTypes.includes(normalized)) {
    throw createError({
      statusCode: 400,
      message: `"reactionType" must be one of: ${validReactionTypes.join(', ')}.`,
    })
  }

  return normalized
}

function normalizeComment(value: unknown): string | null {
  if (value === null) return null

  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"comment" must be a string or null.',
    })
  }

  const comment = value.trim()
  return comment.length ? comment : null
}

function normalizeRating(value: unknown): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw createError({
      statusCode: 400,
      message: '"rating" must be an integer from 0 to 5.',
    })
  }

  if (value < 0 || value > 5) {
    throw createError({
      statusCode: 400,
      message: '"rating" must be an integer from 0 to 5.',
    })
  }

  return value
}

function buildReactionPatch(body: unknown): Prisma.ReactionUpdateInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({
      statusCode: 400,
      message: 'Reaction update payload is required.',
    })
  }

  const record = body as Record<string, unknown>
  const unsupportedFields = Object.keys(record).filter(
    (field) => !allowedPatchFields.has(field),
  )

  if (unsupportedFields.length) {
    throw createError({
      statusCode: 400,
      message:
        'Only reactionType, comment, and rating may be updated. Reaction ownership, category, and target are immutable.',
    })
  }

  const input = record as ReactionPatchBody
  const data: Prisma.ReactionUpdateInput = {}

  if (input.reactionType !== undefined) {
    data.reactionType = normalizeReactionType(input.reactionType)
  }

  if (input.comment !== undefined) {
    data.comment = normalizeComment(input.comment)
  }

  if (input.rating !== undefined) {
    data.rating = normalizeRating(input.rating)
  }

  if (!Object.keys(data).length) {
    throw createError({
      statusCode: 400,
      message: 'No valid Reaction update fields were provided.',
    })
  }

  return data
}

export default defineEventHandler(async (event) => {
  const reactionId = Number(event.context.params?.id)

  try {
    if (!Number.isInteger(reactionId) || reactionId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid reaction ID. It must be a positive integer.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingReaction = await prisma.reaction.findUnique({
      where: { id: reactionId },
      select: { id: true, userId: true },
    })

    if (!existingReaction) {
      throw createError({
        statusCode: 404,
        message: 'Reaction not found.',
      })
    }

    if (existingReaction.userId !== user.id && !userIsAdmin(user)) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this reaction.',
      })
    }

    const body = await readBody<unknown>(event)
    const data = await prisma.reaction.update({
      where: { id: reactionId },
      data: buildReactionPatch(body),
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: 'Reaction updated successfully.',
      data,
      statusCode: 200,
    }
  } catch (error) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message: handled.message || `Failed to update reaction with ID ${reactionId}.`,
      data: null,
      statusCode,
    }
  }
})
