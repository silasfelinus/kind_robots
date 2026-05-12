// /server/api/dreams/chats/index.post.ts
import { defineEventHandler, readBody, getQuery, createError } from 'h3'
import prisma from '@/server/utils/prisma'
import { errorHandler } from '@/server/utils/error'
import { validateApiKey } from '@/server/utils/validateKey'
import type { ChatType, Prisma } from '~/prisma/generated/prisma/client'

type CreateDreamChatBody = {
  type?: ChatType
  sender?: unknown
  title?: unknown
  content?: unknown
  recipient?: unknown
  botResponse?: unknown
  userId?: unknown
  dreamId?: unknown
  promptId?: unknown
  artImageId?: unknown
  previousEntryId?: unknown
  originId?: unknown
  recipientId?: unknown
  botId?: unknown
  characterId?: unknown
  serverId?: unknown
  rewardId?: unknown
  scenarioId?: unknown
  botName?: unknown
  channel?: unknown
  updateDream?: unknown
  currentVibe?: unknown
  currentPrompt?: unknown
  isPublic?: unknown
  isFavorite?: unknown
  isRead?: unknown
  isMature?: unknown
}

const allowedDreamChatTypes: ChatType[] = [
  'Dream',
  'BotResponse',
  'ToBot',
  'ToCharacter',
  'Scenario',
  'Reward',
  'Story',
]

const userSelect = {
  id: true,
  username: true,
  avatarImage: true,
} satisfies Prisma.UserSelect

const artImageSelect = {
  id: true,
  fileName: true,
  fileType: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
  artId: true,
  galleryId: true,
} satisfies Prisma.ArtImageSelect

function asNullableString(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()

  return trimmed ? trimmed : null
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false

  return undefined
}

function asOptionalPositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)

    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed
    }
  }

  return undefined
}

function getDreamIdFromRequest(
  body: CreateDreamChatBody,
  query: Record<string, unknown>,
): number | undefined {
  const bodyDreamId = asOptionalPositiveInt(body.dreamId)
  const queryDreamId = asOptionalPositiveInt(query.dreamId)

  return bodyDreamId ?? queryDreamId
}

function buildDefaultTitle(type: ChatType, dreamTitle: string): string {
  if (type === 'BotResponse') return `${dreamTitle} response`
  if (type === 'ToBot') return `${dreamTitle} bot exchange`
  if (type === 'ToCharacter') return `${dreamTitle} character exchange`
  if (type === 'Scenario') return `${dreamTitle} scenario beat`
  if (type === 'Reward') return `${dreamTitle} item twist`
  if (type === 'Story') return `${dreamTitle} story beat`

  return dreamTitle
}

function buildUpdateSummary(options: {
  vibeUpdated: boolean
  promptUpdated: boolean
}): string {
  const updates: string[] = []

  if (options.vibeUpdated) updates.push('vibe')
  if (options.promptUpdated) updates.push('prompt')

  if (!updates.length) return 'Dream chat created.'

  return `Dream ${updates.join(' and ')} updated through chat.`
}

export default defineEventHandler(async (event) => {
  let dreamId: number | undefined

  try {
    const { isValid, user } = await validateApiKey(event)

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const body = await readBody<CreateDreamChatBody>(event)
    const query = getQuery(event)

    dreamId = getDreamIdFromRequest(body, query)

    if (!dreamId) {
      throw createError({
        statusCode: 400,
        message: 'Missing or invalid required field: "dreamId".',
      })
    }

    const bodyUserId = asOptionalPositiveInt(body.userId)

    if (bodyUserId && bodyUserId !== user.id) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the provided authorization token.',
      })
    }

    const type = body.type ?? 'Dream'
    const content = asNullableString(body.content)

    if (!allowedDreamChatTypes.includes(type)) {
      throw createError({
        statusCode: 400,
        message: 'Missing or invalid required field: "type".',
      })
    }

    if (!content) {
      throw createError({
        statusCode: 400,
        message: 'Missing required field: "content".',
      })
    }

    const characterId = asOptionalPositiveInt(body.characterId)
    const botId = asOptionalPositiveInt(body.botId)
    const serverId = asOptionalPositiveInt(body.serverId)
    const rewardId = asOptionalPositiveInt(body.rewardId)
    const scenarioId = asOptionalPositiveInt(body.scenarioId)

    const dream = await prisma.dream.findUnique({
      where: { id: dreamId },
      include: {
        User: {
          select: userSelect,
        },
        Characters: {
          select: {
            id: true,
            userId: true,
            isPublic: true,
            isMature: true,
            name: true,
          },
        },
        Rewards: {
          select: {
            id: true,
            userId: true,
            isPublic: true,
            isMature: true,
            label: true,
            text: true,
          },
        },
        Scenario: {
          select: {
            id: true,
            userId: true,
            isPublic: true,
            isMature: true,
            title: true,
          },
        },
      },
    })

    if (!dream) {
      throw createError({
        statusCode: 404,
        message: `Dream with ID ${dreamId} not found.`,
      })
    }

    const isOwner = dream.userId === user.id
    const isAdmin = user.Role === 'ADMIN'
    const canMutateDream = isOwner || isAdmin
    const canChatInDream = dream.isPublic || canMutateDream

    if (!canChatInDream) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to add chats to this Dream.',
      })
    }

    if (!dream.isActive && !canMutateDream) {
      throw createError({
        statusCode: 403,
        message: 'This Dream is archived and cannot receive new public chats.',
      })
    }

    if (characterId) {
      const characterInDream = dream.Characters.some(
        (character) => character.id === characterId,
      )

      if (!characterInDream && !canMutateDream) {
        throw createError({
          statusCode: 403,
          message: 'That character is not available in this Dream.',
        })
      }
    }

    if (rewardId) {
      const rewardInDream = dream.Rewards.some(
        (reward) => reward.id === rewardId,
      )

      if (!rewardInDream && !canMutateDream) {
        throw createError({
          statusCode: 403,
          message: 'That item is not available in this Dream.',
        })
      }
    }

    if (scenarioId && dream.scenarioId && scenarioId !== dream.scenarioId) {
      throw createError({
        statusCode: 400,
        message: 'The provided scenario does not match this Dream.',
      })
    }

    const userRecord = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        username: true,
      },
    })

    const sender =
      asNullableString(body.sender) ?? userRecord?.username ?? `User ${user.id}`

    const title =
      asNullableString(body.title) ?? buildDefaultTitle(type, dream.title)

    const data: Prisma.ChatUncheckedCreateInput = {
      type,
      sender,
      content,
      title,
      recipient: asNullableString(body.recipient),
      botResponse: asNullableString(body.botResponse),
      userId: user.id,
      dreamId,
      promptId: asOptionalPositiveInt(body.promptId),
      artImageId: asOptionalPositiveInt(body.artImageId),
      previousEntryId: asOptionalPositiveInt(body.previousEntryId),
      originId: asOptionalPositiveInt(body.originId),
      recipientId: asOptionalPositiveInt(body.recipientId),
      botId,
      characterId,
      serverId,
      botName: asNullableString(body.botName),
      channel: asNullableString(body.channel) ?? `dream-${dreamId}`,
      isPublic: asOptionalBoolean(body.isPublic) ?? dream.isPublic,
      isFavorite: asOptionalBoolean(body.isFavorite) ?? false,
      isRead: asOptionalBoolean(body.isRead) ?? false,
      isMature: asOptionalBoolean(body.isMature) ?? dream.isMature,
    }

    const created = await prisma.chat.create({
      data,
      include: {
        User: {
          select: userSelect,
        },
        Bot: {
          select: {
            id: true,
            name: true,
            subtitle: true,
            avatarImage: true,
            personality: true,
            isPublic: true,
            isMature: true,
            userId: true,
          },
        },
        Character: {
          select: {
            id: true,
            name: true,
            honorific: true,
            species: true,
            class: true,
            personality: true,
            imagePath: true,
            artImageId: true,
            isPublic: true,
            isMature: true,
            userId: true,
          },
        },
        Prompt: true,
        ArtImage: {
          select: artImageSelect,
        },
        Reactions: true,
      },
    })

    let dreamUpdateSummary: string | null = null

    if (body.updateDream === true) {
      if (!canMutateDream) {
        throw createError({
          statusCode: 403,
          message:
            'You can chat in this Dream, but only the owner can reshape it.',
        })
      }

      const dreamUpdate: Prisma.DreamUncheckedUpdateInput = {}
      const currentVibe = asNullableString(body.currentVibe)
      let vibeUpdated = false
      let promptUpdated = false

      if (currentVibe) {
        dreamUpdate.currentVibe = currentVibe
        vibeUpdated = true
      }

      if (body.currentPrompt !== undefined) {
        dreamUpdate.currentPrompt = asNullableString(body.currentPrompt)
        promptUpdated = true
      }

      if (Object.keys(dreamUpdate).length > 0) {
        await prisma.dream.update({
          where: { id: dreamId },
          data: dreamUpdate,
        })

        dreamUpdateSummary = buildUpdateSummary({
          vibeUpdated,
          promptUpdated,
        })
      }
    }

    event.node.res.statusCode = 201

    return {
      success: true,
      data: created,
      message: dreamUpdateSummary || 'Dream chat created successfully.',
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message:
        message ||
        `Failed to create Dream chat${dreamId ? ` for Dream ID ${dreamId}` : ''}.`,
      statusCode: event.node.res.statusCode,
    }
  }
})
