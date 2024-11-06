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

    const reaction = await fetchReactionById(id)

    if (!reaction) {
      throw new Error(`Reaction with ID ${id} not found.`)
    }

    return {
      success: true,
      data: { reaction },
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
