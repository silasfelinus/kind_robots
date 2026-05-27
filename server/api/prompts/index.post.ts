// /server/api/prompts/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'
import type { Prisma, Prompt } from '~/prisma/generated/prisma/client'

type PromptCreateBody = Partial<Prompt> & {
  CreationSource?: string
}

function getPositiveIntegerOrUndefined(value: unknown): number | undefined {
  const numericValue = Number(value)

  return Number.isInteger(numericValue) && numericValue > 0
    ? numericValue
    : undefined
}

async function assertRelatedRecordsExist(options: {
  userId: number
  pitchId?: number
  botId?: number
  artImageId?: number
}) {
  const { userId, pitchId, botId, artImageId } = options

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

  if (pitchId) {
    const pitch = await prisma.pitch.findUnique({
      where: { id: pitchId },
      select: { id: true },
    })

    if (!pitch) {
      throw createError({
        statusCode: 404,
        message: `Pitch ID not found: ${pitchId}.`,
      })
    }
  }

  if (botId) {
    const bot = await prisma.bot.findUnique({
      where: { id: botId },
      select: { id: true },
    })

    if (!bot) {
      throw createError({
        statusCode: 404,
        message: `Bot ID not found: ${botId}.`,
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

    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const promptData = await readBody<PromptCreateBody>(event)

    if (!promptData.prompt || typeof promptData.prompt !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'The "prompt" field is required and must be a string.',
      })
    }

    const authenticatedUserId = user.id
    const requestedUserId = getPositiveIntegerOrUndefined(promptData.userId)
    const isAdmin = user.Role === 'ADMIN' || user.id === 1
    const isServerKey = kind === 'server'

    const userId =
      (isAdmin || isServerKey) && requestedUserId
        ? requestedUserId
        : authenticatedUserId

    if (
      requestedUserId &&
      requestedUserId !== authenticatedUserId &&
      !isAdmin &&
      !isServerKey
    ) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    const pitchId = getPositiveIntegerOrUndefined(promptData.pitchId)
    const botId = getPositiveIntegerOrUndefined(promptData.botId)
    const artImageId = getPositiveIntegerOrUndefined(promptData.artImageId)

    await assertRelatedRecordsExist({
      userId,
      pitchId,
      botId,
      artImageId,
    })

    const resolvedSource = (promptData.creationSource ??
      promptData.CreationSource ??
      'UNKNOWN') as string

    const createData: Prisma.PromptCreateInput = {
      prompt: promptData.prompt.trim(),
      creationSource: resolvedSource as any,
      isPublic: promptData.isPublic ?? false,
      isActive: promptData.isActive ?? true,
      User: {
        connect: { id: userId },
      },
      Pitch: pitchId
        ? {
            connect: { id: pitchId },
          }
        : undefined,
      Bot: botId
        ? {
            connect: { id: botId },
          }
        : undefined,
      ArtImage: artImageId
        ? {
            connect: { id: artImageId },
          }
        : undefined,
    }

    const data = await prisma.prompt.create({
      data: createData,
      include: {
        User: {
          select: {
            id: true,
            username: true,
            Role: true,
          },
        },
        Pitch: {
          select: {
            id: true,
            title: true,
            pitch: true,
          },
        },
        Bot: {
          select: {
            id: true,
            name: true,
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
      data,
      message: 'Prompt created successfully.',
      statusCode: 201,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to create prompt.',
      error: message,
      statusCode: event.node.res.statusCode,
    }
  }
})
