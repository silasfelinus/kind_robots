import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from './../utils/prisma'
import type { Prisma, Bot } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate the bot data from the request body
    const botsData: Partial<Bot> = await readBody(event)

    // Check if userId in botsData matches the authenticated user
    const userId = botsData.userId ?? authenticatedUserId
    if (userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    // Ensure that essential fields like "name" are present
    if (!botsData.name) {
      throw createError({
        statusCode: 400,
        message: 'Bot name is required.',
      })
    }

    // Proceed with bot creation
    const result = await addBot({ ...botsData, userId })

    if (result.error) {
      throw createError({
        statusCode: 400,
        message: result.error,
      })
    }

    event.node.res.statusCode = 201 // Created
    return { success: true, bot: result.bot }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: 'Failed to create a new bot',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

// Function to add a single bot
export async function addBot(
  botData: Partial<Bot>,
): Promise<{ bot: Bot | null; error: string | null }> {
  try {
    const dataToSave: Prisma.BotCreateInput = {
      BotType: botData.BotType ?? 'PROMPTBOT',
      name: botData.name!,
      subtitle: botData.subtitle ?? null,
      description: botData.description ?? null,
      avatarImage: botData.avatarImage ?? '/images/bot.webp',
      botIntro: botData.botIntro ?? '',
      userIntro: botData.userIntro ?? '',
      prompt: botData.prompt ?? '',
      trainingPath: botData.trainingPath ?? null,
      theme: botData.theme ?? null,
      personality: botData.personality ?? null,
      sampleResponse: botData.sampleResponse ?? null,
      designer: botData.designer ?? 'Kind Guest',
      isPublic: botData.isPublic ?? false,
      underConstruction: botData.underConstruction ?? false,
      canDelete: botData.canDelete ?? false,
      tagline: botData.tagline ?? '',
      User: { connect: { id: botData.userId as number } }, // Ensure userId is assigned
    }

    const bot = await prisma.bot.create({ data: dataToSave })
    return { bot, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { bot: null, error: `Failed to create bot: ${errorMessage}` }
  }
}
