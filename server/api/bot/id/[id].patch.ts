// server/api/bot/id/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma, Bot } from '@prisma/client'
import prisma from './../../utils/prisma'
import { verifyJwtToken } from '../../auth'

// Fetch bot by id
export async function fetchBotById(id: number): Promise<Bot | null> {
  try {
    const bot = await prisma.bot.findUnique({ where: { id } })
    console.log(`Fetched bot with id "${id}":`, bot)
    return bot
  } catch (error) {
    console.error(`Error fetching bot with id "${id}":`, error)
    return null
  }
}

// Update bot by id
async function updateBot(id: number, data: Partial<Bot>): Promise<Bot | null> {
  try {
    const updatedBot = await prisma.bot.update({
      where: { id },
      data: data as Prisma.BotUpdateInput,
    })
    console.log(`Bot with id "${id}" updated successfully:`, updatedBot)
    return updatedBot
  } catch (error) {
    console.error(`Failed to update bot with id "${id}":`, error)
    return null
  }
}

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Validate bot ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid bot ID.',
      })
    }

    // Extract and validate JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch bot by ID to ensure it exists
    const existingBot = await fetchBotById(id)
    if (!existingBot) {
      throw createError({
        statusCode: 404,
        message: `Bot with id "${id}" not found.`,
      })
    }

    // Verify ownership of the bot
    if (existingBot.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this bot.',
      })
    }

    // Parse and validate request body
    const data = await readBody(event)
    if (!data || Object.keys(data).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Attempt to update the bot
    const updatedBot = await updateBot(id, data)

    if (!updatedBot) {
      throw createError({
        statusCode: 404,
        message: `Bot with id "${id}" not found.`,
      })
    }

    return { success: true, bot: updatedBot }
  } catch (error: unknown) {
    console.error(
      `Failed to update bot with id "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
    return {
      success: false,
      message: `Failed to update bot with id "${id}". ${error instanceof Error ? error.message : 'Unknown error'}`,
      statusCode: 500,
    }
  }
})
