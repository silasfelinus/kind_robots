// /server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllPrompts, fetchArtByPromptId } from './artQueries'

export default defineEventHandler(async () => {
  try {
    const prompts = await fetchAllPrompts()

    // Fetch related Art for each Prompt and convert BigInts to Strings if necessary
    const promptDetails = await Promise.all(
      prompts.map(async (prompt) => {
        const art = await fetchArtByPromptId(prompt.id)

        // Convert BigInt properties to strings for compatibility
        const artProcessed = JSON.parse(
          JSON.stringify(art, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v,
          ),
        )
        const promptProcessed = JSON.parse(
          JSON.stringify(prompt, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v,
          ),
        )

        return { ...promptProcessed, Art: artProcessed }
      }),
    )

    // Return response in the standardized format
    return { success: true, data: { prompts: promptDetails } }
  } catch (error: unknown) {
    // Use the errorHandler to process the error with a consistent response format
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      message: `Failed to fetch prompts: ${message}`,
      statusCode: statusCode || 500,
    }
  }
})
