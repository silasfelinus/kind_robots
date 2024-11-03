import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Bot } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
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
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const botData = await readBody<Partial<Bot>>(event)

    // Validate essential fields
    if (!botData.name) {
      event.node.res.statusCode = 400 // Bad Request
      return {
        success: false,
        message: 'Bot name is required.',
        statusCode: 400,
      }
    }

    // Pass the validated userId
    botData.userId = user.id
    const result = await addSingleBot(botData)

    if (result.error) {
      throw new Error(result.error)
    }

    event.node.res.statusCode = 201 // Created
    return { success: true, bot: result.bot, statusCode: 201 }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: 'Failed to create a new bot',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

export async function addSingleBot(
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
      theme: botData.theme ?? null,
      personality: botData.personality ?? null,
      sampleResponse: botData.sampleResponse ?? null,
      designer: botData.designer ?? 'Kind Guest',
      isPublic: botData.isPublic ?? false,
      underConstruction: botData.underConstruction ?? false,
      canDelete: botData.canDelete ?? false,
      tagline: botData.tagline ?? '',
      User: botData.userId ? { connect: { id: botData.userId } } : undefined,
    }

    const bot = await prisma.bot.create({ data: dataToSave })
    return { bot, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { bot: null, error: `Failed to create bot: ${errorMessage}` }
  }
}
