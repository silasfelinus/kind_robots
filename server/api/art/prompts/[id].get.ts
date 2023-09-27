// server/api/art/prompts/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { fetchArtPromptById } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const artPrompt = await fetchArtPromptById(id)
    if (!artPrompt) {
      return { success: false, message: 'ArtPrompt not found' }
    }
    const artIds = artPrompt.Art.map((a) => a.id) // TypeScript should now recognize the Art property
    return { success: true, prompt: artPrompt.prompt, artIds }
  } catch (error: any) {
    return errorHandler(error)
  }
})
