// /server/api/reactions/index.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import {
  ReactionType,
  Reaction_reactionCategory,
  type Prisma,
} from '~/prisma/generated/prisma/client'

type RequestData = {
  userId: number
  reactionType: string
  reactionCategory?: string
  artId?: number
  artImageId?: number
  componentId?: number
  dreamId?: number
  comment?: string
  rating?: number
}

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function mapReactionType(type: string): ReactionType | undefined {
  const normalizedType = type.toUpperCase() as keyof typeof ReactionType
  return ReactionType[normalizedType]
}

function normalizeCategory(
  requestData: RequestData,
): Reaction_reactionCategory {
  const explicit = requestData.reactionCategory

  if (typeof explicit === 'string') {
    const key = explicit.trim().toUpperCase().replace(/[\s-]+/g, '_')
    const aliases: Record<string, Reaction_reactionCategory> = {
      ART: Reaction_reactionCategory.ART_IMAGE,
      ARTIMAGE: Reaction_reactionCategory.ART_IMAGE,
      ART_IMAGE: Reaction_reactionCategory.ART_IMAGE,
      IMAGE: Reaction_reactionCategory.ART_IMAGE,
      COMPONENT: Reaction_reactionCategory.COMPONENT,
      DREAM: Reaction_reactionCategory.DREAM,
    }

    const aliased = aliases[key]
    if (aliased) return aliased

    if (
      Object.values(Reaction_reactionCategory).includes(
        key as Reaction_reactionCategory,
      )
    ) {
      return key as Reaction_reactionCategory
    }
  }

  if (toPositiveId(requestData.dreamId)) return Reaction_reactionCategory.DREAM
  if (toPositiveId(requestData.componentId))
    return Reaction_reactionCategory.COMPONENT

  return Reaction_reactionCategory.ART_IMAGE
}

function buildTarget(requestData: RequestData) {
  const artImageId = toPositiveId(requestData.artImageId ?? requestData.artId)
  const componentId = toPositiveId(requestData.componentId)
  const dreamId = toPositiveId(requestData.dreamId)

  if (dreamId) return { field: 'dreamId' as const, id: dreamId }
  if (componentId) return { field: 'componentId' as const, id: componentId }
  if (artImageId) return { field: 'artImageId' as const, id: artImageId }

  return null
}

export default defineEventHandler(async (event) => {
  try {
    const requestData = await readBody<RequestData>(event)

    if (!requestData) {
      throw createError({ statusCode: 400, message: 'Invalid request data.' })
    }

    const userId = toPositiveId(requestData.userId)

    if (!userId || !requestData.reactionType) {
      throw createError({
        statusCode: 400,
        message: 'Missing required fields: userId or reactionType.',
      })
    }

    const reactionType = mapReactionType(requestData.reactionType)

    if (!reactionType) {
      throw createError({ statusCode: 400, message: 'Invalid reactionType.' })
    }

    const target = buildTarget(requestData)

    if (!target) {
      throw createError({
        statusCode: 400,
        message: 'A dreamId, componentId, artImageId, or artId is required.',
      })
    }

    const reactionCategory = normalizeCategory(requestData)
    const targetWhere = { [target.field]: target.id }

    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId,
        reactionType,
        reactionCategory,
        ...targetWhere,
      },
    })

    const mutationData: Prisma.ReactionUncheckedCreateInput = {
      userId,
      reactionType,
      reactionCategory,
      [target.field]: target.id,
      comment: requestData.comment,
      rating: Number.isFinite(Number(requestData.rating))
        ? Math.max(0, Math.min(5, Math.round(Number(requestData.rating))))
        : 0,
    }

    const reaction = existingReaction
      ? await prisma.reaction.update({
          where: { id: existingReaction.id },
          data: mutationData,
        })
      : await prisma.reaction.create({ data: mutationData })

    event.node.res.statusCode = existingReaction ? 200 : 201

    return {
      success: true,
      reaction,
      data: reaction,
      message: existingReaction
        ? 'Reaction updated successfully.'
        : 'Reaction created successfully.',
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create/update reaction.',
    }
  }
})

export async function fetchAllReactions() {
  try {
    return await prisma.reaction.findMany({})
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export async function fetchReactionById(id: number) {
  try {
    const reaction = await prisma.reaction.findUnique({
      where: { id },
    })

    if (!reaction) {
      throw new Error(`Reaction with ID ${id} not found`)
    }

    return reaction
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
