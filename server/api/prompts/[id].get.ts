import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchArtByPromptId, fetchPromptById } from './artQueries'

// Event handler for fetching Prompt and related Art by ID
export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return {
        success: false,
        message: 'Invalid ID format.',
        statusCode: 400, // Bad Request
      }
    }

    // Fetch Prompt by ID
    const prompt = await fetchPromptById(id)

    if (!prompt) {
      return {
        success: false,
        message: 'Prompt not found',
        statusCode: 404, // Not Found
      }
    }

    // Fetch related Art by Prompt ID
    const art = await fetchArtByPromptId(id)

    // Extract Art IDs
    const artIds = art.map((a) => a.id)

    return { success: true, prompt: prompt.prompt, artIds }
  } catch (error: unknown) {
    console.error('Error fetching prompt or related art:', error)
    // Use the errorHandler to process the error
    return errorHandler({
      error,
      context: 'Fetching Prompt and related Art by ID',
    })
  }
})
