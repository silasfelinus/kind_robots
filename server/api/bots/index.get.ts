// /server/api/bots/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchBots } from '.'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100

    // Fetch bots with pagination
    const bots = await fetchBots(page, pageSize)

    // Standardized response format
    return { success: true, data: { bots } }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
