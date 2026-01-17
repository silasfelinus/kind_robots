// server/api/reactions/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { fetchAllReactions } from '.'

export default defineEventHandler(async () => {
  try {
    const data = await fetchAllReactions()

    return {
      success: true,
      data,
    }
  } catch (error: unknown) {
    console.error('Error fetching reactions in API handler:', error)
    return errorHandler(error)
  }
})
