// /server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllPrompts, fetchArtByPromptId } from './artQueries'

export default defineEventHandler(async () => {
  try {
    const artPrompts = await fetchAllPrompts()

    // Fetch related Art for each Prompt and convert BigInts to Strings
    const artPromptDetails = await Promise.all(
      artPrompts.map(async (artPrompt) => {
        const art = await fetchArtByPromptId(artPrompt.id)
        // Assuming 'art' and 'artPrompt' might have BigInt properties
        const artProcessed = JSON.parse(
          JSON.stringify(art, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v,
          ),
        )
        const artPromptProcessed = JSON.parse(
          JSON.stringify(artPrompt, (_, v) =>
            typeof v === 'bigint' ? v.toString() : v,
          ),
        )
        return { ...artPromptProcessed, Art: artProcessed }
      }),
    )

    return { success: true, artPrompts: artPromptDetails }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
