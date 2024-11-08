// /server/api/reactions/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchReactionById } from '.' // Ensure this path is correct based on your project structure

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id) || id <= 0) {
      throw new Error('A valid reaction ID is required.')
    }

    const data = await fetchReactionById(id)

    if (!data) {
      throw new Error(`Reaction with ID ${id} not found.`)
    }

    return {
      success: true,
      data,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      data: {
        message:
          handledError.message ||
          'An error occurred while fetching the reaction.',
      },
    }
  }
})
