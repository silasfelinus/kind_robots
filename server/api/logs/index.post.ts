// /server/api/logs/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { validateApiKey } from '../../utils/validateKey'

type LogCreateBody = {
  message?: string
  timestamp?: string
  username?: string
  userId?: number
}

export default defineEventHandler(async (event) => {
  try {
    const validation = await validateApiKey(event)

    if (!validation.isValid) {
      return errorHandler({
        error: new Error('Unauthorized'),
        message: 'Unauthorized',
        statusCode: 401,
      })
    }

    const body = await readBody<LogCreateBody>(event)

    if (!body.message || typeof body.message !== 'string') {
      return errorHandler({
        error: new Error('Message is required.'),
        message: 'Message is required.',
        statusCode: 400,
      })
    }

    const log = await prisma.log.create({
      data: {
        message: body.message,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
        username: body.username || null,
        userId: typeof body.userId === 'number' ? body.userId : null,
      },
    })

    return {
      success: true,
      message: 'Log created successfully.',
      data: log,
    }
  } catch (error) {
    return errorHandler({
      error,
      message: 'Failed to create log.',
      statusCode: 500,
    })
  }
})
