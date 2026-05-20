// /server/api/reactions/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import {
  ReactionType,
  Reaction_reactionCategory,
  type Prisma,
} from '~/prisma/generated/prisma/client'

type ReactionBody = {
  userId?: unknown
  reactionType?: unknown
  reactionCategory?: unknown
  comment?: unknown
  rating?: unknown
  artImageId?: unknown
  artId?: unknown
  artCollectionId?: unknown
  botId?: unknown
  butterflyId?: unknown
  characterId?: unknown
  chatId?: unknown
  componentId?: unknown
  dreamId?: unknown
  pitchId?: unknown
  promptId?: unknown
  resourceId?: unknown
  rewardId?: unknown
  scenarioId?: unknown
  themeId?: unknown
}

const validReactionTypes = Object.values(ReactionType)
const validReactionCategories = Object.values(Reaction_reactionCategory)

const reactionCategoryAliases: Record<string, Reaction_reactionCategory> = {
  ART: Reaction_reactionCategory.ART_IMAGE,
  ARTIMAGE: Reaction_reactionCategory.ART_IMAGE,
  ART_IMAGE: Reaction_reactionCategory.ART_IMAGE,
  IMAGE: Reaction_reactionCategory.ART_IMAGE,

  COLLECTION: Reaction_reactionCategory.ART_COLLECTION,
  ART_COLLECTION: Reaction_reactionCategory.ART_COLLECTION,

  CHAT: Reaction_reactionCategory.CHAT_EXCHANGE,
  CHAT_EXCHANGE: Reaction_reactionCategory.CHAT_EXCHANGE,
  MESSAGE: Reaction_reactionCategory.MESSAGE,

  BOT: Reaction_reactionCategory.BOT,
  BUTTERFLY: Reaction_reactionCategory.BUTTERFLY,
  CHARACTER: Reaction_reactionCategory.CHARACTER,
  COMPONENT: Reaction_reactionCategory.COMPONENT,
  DREAM: Reaction_reactionCategory.DREAM,
  PITCH: Reaction_reactionCategory.PITCH,
  POST: Reaction_reactionCategory.POST,
  PROMPT: Reaction_reactionCategory.PROMPT,
  RESOURCE: Reaction_reactionCategory.RESOURCE,
  REWARD: Reaction_reactionCategory.REWARD,
  SCENARIO: Reaction_reactionCategory.SCENARIO,
  THEME: Reaction_reactionCategory.THEME,
}

function normalizeReactionType(value: unknown): ReactionType {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"reactionType" is required.',
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

function normalizeReactionCategory(value: unknown): Reaction_reactionCategory {
  if (typeof value !== 'string') {
    throw createError({
      statusCode: 400,
      message: '"reactionCategory" is required.',
    })
  }

  const normalizedKey = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')
  const aliased = reactionCategoryAliases[normalizedKey]

  if (aliased) {
    return aliased
  }

  const normalized = normalizedKey as Reaction_reactionCategory

  if (!validReactionCategories.includes(normalized)) {
    throw createError({
      statusCode: 400,
      message: `"reactionCategory" must be one of: ${validReactionCategories.join(', ')}.`,
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

function toRating(value: unknown): number {
  const parsed = Number(value)

  if (!Number.isFinite(parsed)) return 0

  return Math.max(0, Math.min(5, Math.round(parsed)))
}

function toPositiveId(value: unknown): number | undefined {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function getTargetFields(body: ReactionBody) {
  return {
    artImageId: toPositiveId(body.artImageId ?? body.artId),
    artCollectionId: toPositiveId(body.artCollectionId),
    botId: toPositiveId(body.botId),
    butterflyId: toPositiveId(body.butterflyId),
    characterId: toPositiveId(body.characterId),
    chatId: toPositiveId(body.chatId),
    componentId: toPositiveId(body.componentId),
    dreamId: toPositiveId(body.dreamId),
    pitchId: toPositiveId(body.pitchId),
    promptId: toPositiveId(body.promptId),
    resourceId: toPositiveId(body.resourceId),
    rewardId: toPositiveId(body.rewardId),
    scenarioId: toPositiveId(body.scenarioId),
    themeId: toPositiveId(body.themeId),
  }
}

function getExpectedTargetField(category: Reaction_reactionCategory) {
  const map: Record<
    Reaction_reactionCategory,
    keyof ReturnType<typeof getTargetFields> | null
  > = {
    [Reaction_reactionCategory.ART_IMAGE]: 'artImageId',
    [Reaction_reactionCategory.ART_COLLECTION]: 'artCollectionId',
    [Reaction_reactionCategory.BOT]: 'botId',
    [Reaction_reactionCategory.BUTTERFLY]: 'butterflyId',
    [Reaction_reactionCategory.CHARACTER]: 'characterId',
    [Reaction_reactionCategory.CHAT_EXCHANGE]: 'chatId',
    [Reaction_reactionCategory.COMPONENT]: 'componentId',
    [Reaction_reactionCategory.DREAM]: 'dreamId',
    [Reaction_reactionCategory.PITCH]: 'pitchId',
    [Reaction_reactionCategory.PROMPT]: 'promptId',
    [Reaction_reactionCategory.RESOURCE]: 'resourceId',
    [Reaction_reactionCategory.REWARD]: 'rewardId',
    [Reaction_reactionCategory.SCENARIO]: 'scenarioId',
    [Reaction_reactionCategory.THEME]: 'themeId',
    [Reaction_reactionCategory.MESSAGE]: null,
    [Reaction_reactionCategory.POST]: null,
  }

  return map[category]
}

function buildTargetWhere(
  category: Reaction_reactionCategory,
  targets: ReturnType<typeof getTargetFields>,
): Prisma.ReactionWhereInput {
  const expectedField = getExpectedTargetField(category)

  if (!expectedField) {
    return {}
  }

  const expectedId = targets[expectedField]

  if (!expectedId) {
    throw createError({
      statusCode: 400,
      message: `${expectedField} is required for reactionCategory ${category}.`,
    })
  }

  return {
    [expectedField]: expectedId,
  }
}

export default defineEventHandler(async (event) => {
  try {
    const authorizationHeader = event.node.req.headers.authorization

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]?.trim()

    if (!token) {
      throw createError({
        statusCode: 401,
        message: 'Authorization token is empty.',
      })
    }

    const user = await prisma.user.findFirst({
      where: {
        apiKey: token,
      },
      select: {
        id: true,
      },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<ReactionBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'Reaction payload is required.',
      })
    }

    const reactionType = normalizeReactionType(body.reactionType)
    const reactionCategory = normalizeReactionCategory(body.reactionCategory)
    const targets = getTargetFields(body)
    const targetWhere = buildTargetWhere(reactionCategory, targets)

    const existingReaction = await prisma.reaction.findFirst({
      where: {
        userId: user.id,
        reactionType,
        reactionCategory,
        ...targetWhere,
      },
    })

    const mutationData: Prisma.ReactionUncheckedCreateInput = {
      userId: user.id,
      reactionType,
      reactionCategory,
      comment: toNullableText(body.comment),
      rating: toRating(body.rating),
      ...targets,
    }

    const data = existingReaction
      ? await prisma.reaction.update({
          where: {
            id: existingReaction.id,
          },
          data: mutationData,
        })
      : await prisma.reaction.create({
          data: mutationData,
        })

    event.node.res.statusCode = existingReaction ? 200 : 201

    return {
      success: true,
      message: existingReaction
        ? 'Reaction updated successfully.'
        : 'Reaction created successfully.',
      data,
      reaction: data,
      statusCode: event.node.res.statusCode,
    }
  } catch (error) {
    const handledError = errorHandler(error)

    event.node.res.statusCode = handledError.statusCode || 500

    return {
      success: false,
      message: handledError.message || 'Failed to create/update reaction.',
      statusCode: event.node.res.statusCode,
    }
  }
})
