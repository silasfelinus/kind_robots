import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from './../utils/prisma'
import type { Prisma, Bot } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const botsData: Partial<Bot> = await readBody(event)

    // Check for authorization token and userId match
    const authHeader = event.req.headers.authorization
    if (
      botsData.userId &&
      !authHeader?.startsWith(`Bearer ${botsData.userId}`)
    ) {
      event.node.res.statusCode = 403 // Forbidden
      return {
        success: false,
        message: 'User ID does not match the provided authorization token.',
        statusCode: 403,
      }
    }

    // Validate essential fields
    if (!botsData.name) {
      event.node.res.statusCode = 400 // Bad Request
      return {
        success: false,
        message: 'Bot name is required.',
        statusCode: 400,
      }
    }

    const result = await addBot(botsData)
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

export async function addBot(
  botData: Partial<Bot>,
): Promise<{ bot: Bot | null; error: string | null }> {
  try {
    // Create data object based only on the provided fields, allowing partial input
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
      // Connect the bot to a user if userId is provided
      User: botData.userId ? { connect: { id: botData.userId } } : undefined,
    }

    const bot = await prisma.bot.create({
      data: dataToSave,
    })
    return { bot, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { bot: null, error: `Failed to create bot: ${errorMessage}` }
  }
}
