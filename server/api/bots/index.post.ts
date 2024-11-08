// /server/api/bots/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { Prisma, type Bot } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Read and log the incoming bot data for debugging purposes
    const botData: Partial<Bot> = await readBody(event)
    console.log('Parsed bot data:', botData)

    // Validate authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message:
          'Authorization token is required in the format "Bearer <token>".',
        statusCode: 401,
      }
    }

    // Extract token and find user
    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      return {
        success: false,
        message: 'Invalid or expired token.',
        statusCode: 401,
      }
    }

    const authenticatedUserId = user.id

    // Verify user ID matches the authenticated user
    if (botData.userId && botData.userId !== authenticatedUserId) {
      event.node.res.statusCode = 403
      return {
        success: false,
        message: 'User ID does not match the provided authorization token.',
        statusCode: 403,
      }
    }

    // Validate required fields
    if (!botData.name) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: '"name" is a required field for creating a bot.',
        statusCode: 400,
      }
    }

    // Assign the authenticated user ID
    botData.userId = authenticatedUserId

    // Create the bot
    const data = await createBot(botData)
    event.node.res.statusCode = 201
    return { success: true, data, statusCode: 201 }
  } catch (error) {
    // Handle Prisma-specific errors for unique constraints
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (
        error.code === 'P2002' &&
        (error.meta as { target: string[] }).target.includes('name')
      ) {
        event.node.res.statusCode = 409
        return {
          success: false,
          message:
            'A bot with this name already exists. Please choose a different name.',
          statusCode: 409,
        }
      }
    }

    // Log and return a generic error
    console.error('Error creating bot:', error)
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: 'Failed to create a new bot',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

// Helper function to create a new bot
export async function createBot(bot: Partial<Bot>): Promise<Bot> {
  return prisma.bot.create({
    data: {
      userId: bot.userId ?? 0, // Ensure userId has a default
      name: bot.name ?? 'Unnamed Bot', // Provide a default name if missing
      subtitle: bot.subtitle ?? null,
      description: bot.description ?? null,
      avatarImage: bot.avatarImage ?? '/images/bot.webp',
      botIntro: bot.botIntro ?? '',
      userIntro: bot.userIntro ?? '',
      prompt: bot.prompt ?? '',
      trainingPath: bot.trainingPath ?? null,
      theme: bot.theme ?? null,
      personality: bot.personality ?? null,
      sampleResponse: bot.sampleResponse ?? null,
      designer: bot.designer ?? 'Kind Guest',
      isPublic: bot.isPublic ?? false,
      underConstruction: bot.underConstruction ?? false,
      canDelete: bot.canDelete ?? false,
      tagline: bot.tagline ?? '',
      BotType: bot.BotType ?? 'CHATBOT',
    },
  })
}
