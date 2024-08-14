// /server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import { fetchAllArtPrompts, fetchArtByPromptId } from './artQueries'

export default defineEventHandler(async () => {
  try {
    const artPrompts = await fetchAllArtPrompts()

    // Fetch related Art for each ArtPrompt
    const artPromptDetails = await Promise.all(
      artPrompts.map(async (artPrompt) => {
        const art = await fetchArtByPromptId(artPrompt.id)
        return { ...artPrompt, Art: art }
      }),
    )

    return { success: true, artPrompts: artPromptDetails }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
