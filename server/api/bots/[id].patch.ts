// /server/api/bots/[id].patch.ts
import { defineEventHandler, createError, getRouterParam, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Bot, Prisma } from '~/prisma/generated/prisma/client'

type BotPatchBody = Partial<Bot>

function getStringOrUndefined(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function getBooleanOrUndefined(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const numericValue = Number(value)

  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined
}

function hasUpdateData(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined)
}

async function assertRelatedRecordsExist(options: {
  userId?: number
  serverId?: number
  artImageId?: number
}) {
  const { userId, serverId, artImageId } = options

  if (userId) {
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
    const id = Number(getRouterParam(event, 'id'))

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Bot ID. It must be a positive integer.',
      })
    }

    const { isValid, user, kind } = await validateApiKey(event)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const existingBot = await prisma.bot.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
      },
    })

    if (!existingBot) {
      throw createError({
        statusCode: 404,
        message: `Bot with ID ${id} does not exist.`,
      })
    }

    const isServerKey = kind === 'server'
    const isAdmin = user?.Role === 'ADMIN' || user?.id === 1
    const isOwner = user?.id === existingBot.userId

    if (!isAdmin && !isServerKey && !isOwner) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this bot.',
      })
    }

    const body = await readBody<BotPatchBody>(event)

    if (!body || Object.keys(body).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    const requestedUserId = getPositiveIntegerOrUndefined(body.userId)
    const serverId = getPositiveIntegerOrUndefined(body.serverId)
    const artImageId = getPositiveIntegerOrUndefined(body.artImageId)

    if (requestedUserId && !isAdmin && !isServerKey) {
      throw createError({
        statusCode: 403,
        message: 'Only admins can reassign bot ownership.',
      })
    }

    await assertRelatedRecordsExist({
      userId: requestedUserId,
      serverId,
      artImageId,
    })

    const updateData: Prisma.BotUpdateInput = {
      BotType: getStringOrUndefined(body.BotType),
      name: getStringOrUndefined(body.name),
      subtitle: getStringOrUndefined(body.subtitle),
      description: getStringOrUndefined(body.description),
      avatarImage: getStringOrUndefined(body.avatarImage),
      botIntro: getStringOrUndefined(body.botIntro),
      userIntro: getStringOrUndefined(body.userIntro),
      prompt: getStringOrUndefined(body.prompt),
      trainingPath: getStringOrUndefined(body.trainingPath),
      theme: getStringOrUndefined(body.theme),
      personality: getStringOrUndefined(body.personality),
      modules: getStringOrUndefined(body.modules),
      sampleResponse: getStringOrUndefined(body.sampleResponse),
      tagline: getStringOrUndefined(body.tagline),
      designer: getStringOrUndefined(body.designer),
      serverName: getStringOrUndefined(body.serverName),
      artPrompt: getStringOrUndefined(body.artPrompt),
      isPublic: getBooleanOrUndefined(body.isPublic),
      underConstruction: getBooleanOrUndefined(body.underConstruction),
      canDelete: getBooleanOrUndefined(body.canDelete),
      isMature: getBooleanOrUndefined(body.isMature),
      isActive: getBooleanOrUndefined(body.isActive),
      User: requestedUserId
        ? {
            connect: { id: requestedUserId },
          }
        : undefined,
      Server:
        body.serverId === null
          ? { disconnect: true }
          : serverId
            ? { connect: { id: serverId } }
            : undefined,
      ArtImage:
        body.artImageId === null
          ? { disconnect: true }
          : artImageId
            ? { connect: { id: artImageId } }
            : undefined,
    }

    if (!hasUpdateData(updateData as Record<string, unknown>)) {
      throw createError({
        statusCode: 400,
        message: 'No valid update fields provided.',
      })
    }

    const data = await prisma.bot.update({
      where: { id },
      data: updateData,
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

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Bot with ID ${id} updated successfully.`,
      data,
      statusCode: 200,
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      message: message || 'Failed to update bot.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
