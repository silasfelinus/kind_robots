// server/api/reactions/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllReactions } from '.'

export default defineEventHandler(async () => {
  console.log('Starting to handle fetchAllReactions in API handler')

  try {
    const data = await fetchAllReactions()
    console.log('Successfully fetched reactions:', data)

    return {
      success: true,
      data,
    }
  } catch (error: unknown) {
    console.error('Error fetching reactions in API handler:', error)
    return errorHandler(error)
  }
})
