// server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { fetchAllArtPromptIds } from '.'

export default defineEventHandler(async () => {
  try {
    const artPromptIds = await fetchAllArtPromptIds()
    return { success: true, artPromptIds }
  } catch (error: any) {
    return errorHandler(error)
  }
})
