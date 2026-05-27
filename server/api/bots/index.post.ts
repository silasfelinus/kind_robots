// /server/api/bots/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Bot, Prisma } from '~/prisma/generated/prisma/client'

type BotCreateBody = Partial<Bot>

function getStringOrDefault(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function getStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function getBooleanOrDefault(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
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
    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const botData = await readBody<BotCreateBody>(event)

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1
    const authenticatedUserId = user?.id || 1
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

    const data: Prisma.BotCreateInput = {
      BotType: getStringOrDefault(botData.BotType, 'PROMPTBOT'),
      name,
      subtitle: getStringOrNull(botData.subtitle),
      description: getStringOrNull(botData.description),
      avatarImage: getStringOrNull(botData.avatarImage),
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
    }

    const bot = await prisma.bot.create({
      data,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            Role: true,
          },
        },
        Server: {
          select: {
            id: true,
            title: true,
            label: true,
            serverType: true,
            generationEngine: true,
          },
        },
        ArtImage: {
          select: {
            id: true,
            imagePath: true,
            fileName: true,
          },
        },
      },
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
