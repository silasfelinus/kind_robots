// /server/api/reactions/dream/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../../../utils/prisma'
import { errorHandler } from '../../../utils/error'
import { validateApiKey } from '../../../utils/validateKey'
import {
  ReactionType,
  Reaction_reactionCategory,
  type Prisma,
} from '~/prisma/generated/prisma/client'

type DreamReactionPatchBody = {
  reactionType?: unknown
  comment?: unknown
  rating?: unknown
}

function normalizeReactionType(value: unknown): ReactionType {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'A valid reaction type is required.',
    })
  }

  const normalized = value.trim().toUpperCase() as ReactionType

  if (!Object.values(ReactionType).includes(normalized)) {
    throw createError({
      statusCode: 400,
      message: `reactionType must be one of: ${Object.values(ReactionType).join(', ')}.`,
    })
  }

  return normalized
}

function toNullableText(value: unknown): string | null | undefined {
  if (value === null) return null
  if (typeof value !== 'string') return undefined

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function toRating(value: unknown): number | undefined {
  if (value === undefined) return undefined

  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return undefined

  return Math.max(0, Math.min(5, Math.round(parsed)))
}

export default defineEventHandler(async (event) => {
  let dreamId: number | null = null

  try {
    dreamId = Number(event.context.params?.id)

    if (!Number.isInteger(dreamId) || dreamId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'A valid dream ID is required.',
      })
    }

    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
      select: { id: true },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream #${dreamId} not found.`,
      })
    }

    const body = await readBody<DreamReactionPatchBody>(event)
    const reactionType = normalizeReactionType(body?.reactionType)

    const mutationData: Prisma.ReactionUncheckedCreateInput = {
      userId: user.id,
      dreamId,
      reactionType,
      reactionCategory: Reaction_reactionCategory.DREAM,
      comment: toNullableText(body.comment),
      rating: toRating(body.rating) ?? 0,
    }

    const existingReaction = await prisma.reaction.findFirst({
      where: {
        dreamId,
        userId: user.id,
        reactionCategory: Reaction_reactionCategory.DREAM,
      },
    })

    const reaction = existingReaction
      ? await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: mutationData,
        })
      : await prisma.reaction.create({
          data: mutationData,
        })

    event.node.res.statusCode = existingReaction ? 200 : 201

    return {
      success: true,
      data: { reaction },
      reaction,
      message: existingReaction
        ? `Reaction for dream #${dreamId} updated.`
        : `Reaction for dream #${dreamId} created.`,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      data: {
        message:
          handledError.message ||
          `Failed to update reaction for dream with ID ${dreamId}.`,
      },
    }
  }
})
