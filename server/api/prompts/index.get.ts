// /server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllPrompts, fetchArtByPromptId } from './artQueries'

export default defineEventHandler(async () => {
  try {
    const prompts = await fetchAllPrompts()

    // Fetch related Art for each Prompt and convert BigInts to Strings
    const promptDetails = await Promise.all(
      prompts.map(async (prompt) => {
        const art = await fetchArtByPromptId(prompt.id)
        // Assuming 'art' and 'prompt' might have BigInt properties
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

    return { success: true, prompts: promptDetails }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
