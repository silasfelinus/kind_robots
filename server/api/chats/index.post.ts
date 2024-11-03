// /server/api/chats/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import type { ChatExchange } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate the authorization token
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

    // Read the chat exchange data from the request body
    const exchangeData: Partial<ChatExchange> = await readBody(event)

    // Validate required fields
    const requiredFields: (keyof ChatExchange)[] = [
      'userId',
      'botId',
      'botName',
      'username',
      'userPrompt',
      'botResponse',
    ]
    const missingFields = requiredFields.filter(
      (field) =>
        exchangeData[field] === undefined || exchangeData[field] === null,
    )

    if (missingFields.length > 0) {
      event.node.res.statusCode = 400 // Bad Request
      return {
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
        statusCode: 400,
      }
    }

    // Check if userId in exchangeData matches the authenticated user
    if (exchangeData.userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    // Check if user and bot exist
    const [userExists, botExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: authenticatedUserId } }),
      prisma.bot.findUnique({ where: { id: exchangeData.botId ?? undefined } }),
    ])

    if (!userExists) {
      event.node.res.statusCode = 404 // Not Found
      return {
        success: false,
        message: `User with id ${authenticatedUserId} does not exist.`,
        statusCode: 404,
      }
    }

    if (!botExists) {
      event.node.res.statusCode = 404 // Not Found
      return {
        success: false,
        message: `Bot with id ${exchangeData.botId} does not exist.`,
        statusCode: 404,
      }
    }

    // Define and create the chat exchange
    const newExchange = await prisma.chatExchange.create({
      data: {
        userId: authenticatedUserId,
        botId: exchangeData.botId as number,
        botName: exchangeData.botName as string,
        username: exchangeData.username as string,
        userPrompt: exchangeData.userPrompt as string,
        botResponse: exchangeData.botResponse as string,
        previousEntryId: exchangeData.previousEntryId ?? null,
        promptId: exchangeData.promptId ?? null,
        isPublic: exchangeData.isPublic ?? false,
      },
    })

    event.node.res.statusCode = 201 // Created
    return {
      success: true,
      newExchange,
      statusCode: 201,
    }
  } catch (error: unknown) {
    console.error('Error in /server/api/chats/index.post.ts:', error)
    const { message, statusCode } = errorHandler(error)

    return {
      success: false,
      message: 'Failed to create a new chat exchange',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})
