// /server/api/bots/index.post.ts
import { updateBots } from './index'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const botsData = await readBody(event)
    if (!Array.isArray(botsData)) {
      throw new Error('botsData must be an array');
    }
    const result = await updateBots(botsData)
    return { success: true, ...result }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message || 'Internal Server Error',
    })
  }
})
