// /server/api/bots/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from './../utils/prisma'
import type { Prisma, Bot } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    const result = await addBot(botsData)
    return { success: true, ...result }
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
  if (!botData.name) {
    return { bot: null, error: 'Bot name is required.' }
  }

  try {
    // Ensure we send only the fields that are defined in the schema
    const dataToSave: Prisma.BotCreateInput = {
      BotType: botData.BotType ?? 'PROMPTBOT', // Ensure BotType is set
      name: botData.name,
      subtitle: botData.subtitle || null,
      description: botData.description || null,
      avatarImage: botData.avatarImage || '/images/bot.webp',
      botIntro: botData.botIntro ?? '',
      userIntro: botData.userIntro ?? '',
      prompt: botData.prompt ?? '',
      trainingPath: botData.trainingPath || null,
      theme: botData.theme || null,
      personality: botData.personality || null,
      sampleResponse: botData.sampleResponse || null,
      isPublic: botData.isPublic ?? false,
      underConstruction: botData.underConstruction ?? false,
      canDelete: botData.canDelete ?? false,
      tagline: botData.tagline ?? '',
    }

    // If userId is defined, connect the bot to the User relation
    if (botData.userId !== undefined && botData.userId !== null) {
      dataToSave.User = {
        connect: {
          id: botData.userId,
        },
      }
    }

    const bot = await prisma.bot.create({
      data: dataToSave,
    })
    return { bot, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { bot: null, error: errorMessage }
  }
}
