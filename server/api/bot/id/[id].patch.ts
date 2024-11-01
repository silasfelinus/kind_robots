//server/api/bot/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma } from '@prisma/client'
import prisma from './../../utils/prisma'
import { errorHandler } from '../../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null

  try {
    // Validate bot ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid bot ID.',
      })
    }

    // Extract and validate the JWT token
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

    const userId = user.id

    // Fetch bot by ID to ensure it exists and verify ownership
    const existingBot = await prisma.bot.findUnique({
      where: { id },
    })

    if (!existingBot) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Bot with id "${id}" not found.`,
      })
    }

    if (existingBot.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this bot.',
      })
    }

    // Parse and validate request body
    const data = await readBody(event)
    if (!data || Object.keys(data).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the bot with validated data
    const updatedBot = await prisma.bot.update({
      where: { id },
      data: data as Prisma.BotUpdateInput,
    })

    response = {
      success: true,
      bot: updatedBot,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Failed to update bot with id "${id}": ${error instanceof Error ? error.message : 'Unknown error'}`,
    )

    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update bot with id "${id}".`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
