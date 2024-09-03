// /server/api/rewards/[id].delete.ts
import { defineEventHandler, readBody } from 'h3'
import { deleteReward } from '.'
import { errorHandler } from '../utils/error' // Import your error handler

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { id } = body

    const success = await deleteReward(id)
    return { success }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: 'Failed to delete reward',
      error: handledError.message, // Use the processed error message
    }
  }
})
