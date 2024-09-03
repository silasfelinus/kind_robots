// server/api/art/prompts/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchArtByPromptId, fetchPromptById } from './artQueries'

// Event handler for fetching Prompt and related Art by ID
export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return errorHandler({
        success: false,
        message: 'Invalid ID format.',
        statusCode: 400, // Bad Request
      })
    }

    // Fetch Prompt by ID
    const artPrompt = await fetchPromptById(id)

    if (!artPrompt) {
      return errorHandler({
        success: false,
        message: 'Prompt not found',
        statusCode: 404, // Not Found
      })
    }

    // Fetch related Art by Prompt ID
    const art = await fetchArtByPromptId(id)

    // Extract Art IDs
    const artIds = art.map((a) => a.id)

    return { success: true, prompt: artPrompt.prompt, artIds }
  } catch (error: unknown) {
    // Use the errorHandler to process the error
    return errorHandler(error)
  }
})
