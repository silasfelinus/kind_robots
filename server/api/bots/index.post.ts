// /server/api/bots/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
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
    const botData = await readBody<Partial<Bot>>(event)

    // Validate required fields
    if (!botData.name) {
      return {
        success: false,
        message: '"name" is a required field for creating a bot.',
        statusCode: 400,
      }
    }

    // Set authenticated user ID
    botData.userId = authenticatedUserId

    // Create the bot
    const result = await addBot(botData)

    if (result.error) {
      throw new Error(result.error)
    }

    return { success: true, bot: result.bot, statusCode: 201 }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: 'Failed to create a new bot',
      error: message || 'An unknown error occurred',
      statusCode: statusCode || 500,
    }
  }
})

// Function to add a single bot with enhanced error handling
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
      User: { connect: { id: botData.userId as number } },
    }

    const bot = await prisma.bot.create({ data: dataToSave })
    return { bot, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown database error'
    return { bot: null, error: `Failed to create bot: ${errorMessage}` }
  }
}
