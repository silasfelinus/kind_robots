// /server/api/bots/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import { updateBots } from '../bots'
import { errorHandler } from '../utils/error'
import { createError } from '#imports'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    const result = await updateBots(botsData)
    return { success: true, ...result }
  }
  catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
