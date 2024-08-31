// /server/api/projects/count.get.ts
import { defineEventHandler } from 'h3'
import { countBots } from '.'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const count = await countBots()
    return { success: true, count }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
