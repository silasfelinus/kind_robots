// /server/api/prompts/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchArtByPromptId, fetchPromptById } from '.'

// Event handler for fetching Prompt and related Art by ID
export default defineEventHandler(async (event) => {
  let response

  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id) || id <= 0) {
      throw new Error('Invalid ID format. It must be a positive integer.')
    }

    console.log(`Fetching Prompt with ID: ${id}`)

    // Fetch Prompt by ID
    const prompt = await fetchPromptById(id)

    if (!prompt) {
      console.warn(`Prompt with ID ${id} not found`)
      return {
        success: false,
        message: 'Prompt not found',
        statusCode: 404, // Not Found
      }
    }

    console.log(`Fetched Prompt: ${JSON.stringify(prompt)}`)

    // Fetch related Art by Prompt ID
    const art = await fetchArtByPromptId(id)
    console.log(`Fetched related Art: ${JSON.stringify(art)}`)

    // Extract Art IDs
    const artIds = art.map((a) => a.id)

    // Successful response with prompt and art IDs
    response = {
      success: true,
      data: {
        prompt: prompt.prompt,
        artIds,
      },
      statusCode: 200,
    }
  } catch (error: unknown) {
    console.error('Error fetching prompt or related art:', error)
    // Use the errorHandler to process the error
    const { message, statusCode } = errorHandler({
      error,
      context: 'Fetching Prompt and related Art by ID',
    })

    response = {
      success: false,
      message: message || 'Failed to fetch prompt and related art.',
      statusCode: statusCode || 500,
    }
  }

  return response
})
