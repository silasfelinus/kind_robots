// /server/api/bots/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '@/server/utils/authGuard'
import { normalizeSlugInput } from '../../../utils/slugify'
import { getUniqueBotSlug } from '../../utils/botSlug'
import type { Bot, Prisma } from '~/prisma/generated/prisma/client'
import { botMutationSelect } from './selects'

type BotCreateBody = Partial<Bot> & {
  Dreams?: { connect?: { id: number }[] } | { id: number }[]
  dreamIds?: number[]
}

function getStringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getBooleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function getDreamConnect(
  value: unknown,
): { connect: { id: number }[] } | undefined {
  const raw = (value as any)?.connect ?? value
  if (!Array.isArray(raw)) return undefined
  const ids = raw
    .map((entry: any) =>
      typeof entry === 'object' ? Number(entry.id) : Number(entry),
    )
    .filter((id) => Number.isInteger(id) && id > 0)

  return ids.length ? { connect: ids.map((id) => ({ id })) } : undefined
}

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const numericValue = Number(value)

  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined
}

async function assertRelatedRecordsExist(options: {
  userId: number
  serverId?: number
  artImageId?: number
}) {
  const { userId, serverId, artImageId } = options

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: `User ID not found: ${userId}.`,
    })
  }

  if (serverId) {
    const server = await prisma.server.findUnique({
      where: { id: serverId },
      select: { id: true },
    })

    if (!server) {
      throw createError({
        statusCode: 404,
        message: `Server ID not found: ${serverId}.`,
      })
    }
  }

  if (artImageId) {
    const artImage = await prisma.artImage.findUnique({
      where: { id: artImageId },
      select: { id: true },
    })

    if (!artImage) {
      throw createError({
        statusCode: 404,
        message: `ArtImage ID not found: ${artImageId}.`,
      })
    }
  }
}

export default defineEventHandler(async (event) => {
  try {
    const auth = await requireApiUser(event)
    const { user } = auth
    const botData = await readBody<BotCreateBody>(event)

    const isServerKey = auth.isServerKey
    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const authenticatedUserId = user.id
    const requestedUserId = getPositiveIntegerOrUndefined(botData.userId)
    const userId =
      (isAdmin || isServerKey) && requestedUserId
        ? requestedUserId
        : authenticatedUserId

    if (
      !isAdmin &&
      !isServerKey &&
      requestedUserId &&
      requestedUserId !== userId
    ) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the provided authorization token.',
      })
    }

    const name = getStringOrDefault(botData.name, '')

    if (!name) {
      throw createError({
        statusCode: 400,
        message: '"name" is a required field for creating a bot.',
      })
    }

    const serverId = getPositiveIntegerOrUndefined(botData.serverId)
    const artImageId = getPositiveIntegerOrUndefined(botData.artImageId)

    await assertRelatedRecordsExist({
      userId,
      serverId,
      artImageId,
    })

    const requestedSlug = normalizeSlugInput(botData.slug)
    const slug = await getUniqueBotSlug(prisma, requestedSlug ?? name)

    const data: Prisma.BotCreateInput = {
      BotType: getStringOrDefault(botData.BotType, 'PROMPTBOT'),
      name,
      slug,
      subtitle: getStringOrNull(botData.subtitle),
      description: getStringOrNull(botData.description),
      avatarImage: getStringOrNull(botData.avatarImage),
      imagePath: getStringOrNull(botData.imagePath),
      botIntro: getStringOrDefault(
        botData.botIntro,
        'I am a freshly created bot.',
      ),
      userIntro: getStringOrDefault(botData.userIntro, 'Hello.'),
      prompt: getStringOrDefault(botData.prompt, 'Respond helpfully.'),
      trainingPath: getStringOrNull(botData.trainingPath),
      theme: getStringOrNull(botData.theme),
      personality: getStringOrNull(botData.personality),
      modules: getStringOrNull(botData.modules),
      sampleResponse: getStringOrNull(botData.sampleResponse),
      tagline: getStringOrNull(botData.tagline),
      narrativeVoice: getStringOrNull(botData.narrativeVoice),
      forgeIntro: getStringOrNull(botData.forgeIntro),
      chatBorderImage: getStringOrNull(botData.chatBorderImage),
      designer: getStringOrDefault(botData.designer, 'silasfelinus'),
      serverName: getStringOrNull(botData.serverName),
      artPrompt: getStringOrNull(botData.artPrompt),
      isPublic: getBooleanOrDefault(botData.isPublic, true),
      underConstruction: getBooleanOrDefault(botData.underConstruction, false),
      canDelete: getBooleanOrDefault(botData.canDelete, false),
      isMature: getBooleanOrDefault(botData.isMature, false),
      isActive: getBooleanOrDefault(botData.isActive, true),
      User: {
        connect: { id: userId },
      },
      Server: serverId
        ? {
            connect: { id: serverId },
          }
        : undefined,
      ArtImage: artImageId
        ? {
            connect: { id: artImageId },
          }
        : undefined,
      Dreams: getDreamConnect(botData.Dreams ?? botData.dreamIds),
    }

    const bot = await prisma.bot.create({
      data,
      select: botMutationSelect,
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      data: bot,
      message: 'Bot created successfully.',
      statusCode: 201,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to create a new bot.',
      statusCode: event.node.res.statusCode,
    }
  }
})
