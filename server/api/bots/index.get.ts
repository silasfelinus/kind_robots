// /server/api/bots/index.get.ts
import { defineEventHandler } from 'h3'
import { fetchBots } from '.'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const page = Number(event.context.query?.page) || 1
    const pageSize = Number(event.context.query?.pageSize) || 100

    // Fetch bots with pagination, now returns a flat data structure
    const result = await fetchBots(page, pageSize)

    // Return the standardized response
    return result // { success: true, data: bots } is returned as-is
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    throw createError({
      statusCode: statusCode || 500,
      statusMessage: message,
    })
  }
})
