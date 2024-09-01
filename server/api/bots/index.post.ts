// /server/api/bots/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../utils/error' // Import the error handler
import prisma from './../utils/prisma'
import type { Prisma, Bot } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    const result = await addBot(botsData)
    return { success: true, ...result }
  } catch (error) {
    // Use the error handler to process the error
    const { message, statusCode } = errorHandler(error)

    // Return the error response with the processed message and status code
    return {
      success: false,
      message: 'Failed to create a new bot',
      error: message,
      statusCode: statusCode || 500, // Default to 500 if no status code is provided
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
    const bot = await prisma.bot.create({
      data: botData as Prisma.BotCreateInput,
    })
    return { bot, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { bot: null, error: errorMessage }
  }
}
