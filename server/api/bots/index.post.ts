// /server/api/bots/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { validateApiKey } from '../utils/validateKey'
import type { Prisma, Bot } from '~/server/generated/prisma'

export default defineEventHandler(async (event) => {
  try {
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id
    const botData = await readBody<Partial<Bot>>(event)
    console.log('Parsed bot data:', botData)

    if (botData.userId && botData.userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the provided authorization token.',
      })
    }

    if (!botData.name) {
      event.node.res.statusCode = 400
      return {
        success: false,
        message: '"name" is a required field for creating a bot.',
      }
    }

    botData.userId = authenticatedUserId

    const data = await prisma.bot.create({
      data: botData as Prisma.BotCreateInput,
    })

    event.node.res.statusCode = 201
    return {
      success: true,
      data,
      message: 'Bot created successfully',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null,
      message: 'Failed to create a new bot',
      error: message || 'An unknown error occurred',
    }
  }
})
