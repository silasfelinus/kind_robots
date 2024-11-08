// /server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchArtByPromptId } from '.'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    // Fetch all prompts and their related Art in a single consolidated function
    const prompts = await prisma.prompt.findMany()

    const data = await Promise.all(
      prompts.map(async (prompt) => {
        const art = await fetchArtByPromptId(prompt.id)

        // Convert BigInt properties to strings in both prompt and art data
        const processedPrompt = JSON.parse(
          JSON.stringify(prompt, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v,
          ),
        )
        const processedArt = JSON.parse(
          JSON.stringify(art, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v,
          ),
        )

        return { ...processedPrompt, Art: processedArt }
      }),
    )

    // Return success response with prompt details
    return {
      success: true,
      data,
      message: 'Prompts fetched successfully.',
    }
  } catch (error: unknown) {
    // Process error using errorHandler and log for debugging
    const { message, statusCode } = errorHandler(error)
    console.error(`Failed to fetch prompts: ${message}`)
    return {
      success: false,
      message: `Failed to fetch prompts: ${message}`,
      statusCode: statusCode || 500,
    }
  }
})
