// /server/api/logs/index.post.ts
import { createError, defineEventHandler, readBody } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireApiUser } from '../../utils/authGuard'

type LogCreateBody = {
  message?: unknown
}

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireApiUser(event)
    const body = await readBody<LogCreateBody>(event)

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw createError({
        statusCode: 400,
        message: 'A JSON log body is required.',
      })
    }

    const unknownFields = Object.keys(body).filter((field) => field !== 'message')

    if (unknownFields.length) {
      throw createError({
        statusCode: 400,
        message: `Unsupported log fields: ${unknownFields.join(', ')}. Identity and timestamps are server-owned.`,
      })
    }

    if (typeof body.message !== 'string' || !body.message.trim()) {
      throw createError({
        statusCode: 400,
        message: 'Message is required.',
      })
    }

    const message = body.message.trim()

    if (message.length > 10_000) {
      throw createError({
        statusCode: 400,
        message: 'Message must be 10000 characters or fewer.',
      })
    }

    const log = await prisma.log.create({
      data: {
        message,
        timestamp: new Date(),
        username: user.username || null,
        userId: user.id,
      },
    })

    event.node.res.statusCode = 201

    return {
      success: true,
      message: 'Log created successfully.',
      data: log,
      statusCode: 201,
    }
  } catch (error) {
    const handled = errorHandler(error)
    event.node.res.statusCode = handled.statusCode || 500

    return {
      success: false,
      message: handled.message || 'Failed to create log.',
      data: null,
      statusCode: event.node.res.statusCode,
    }
  }
})
