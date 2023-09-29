// server/api/art/prompts/all.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { fetchAllArtPrompts } from '.'

export default defineEventHandler(async () => {
  try {
    const artPrompts = await fetchAllArtPrompts()
    return { success: true, artPrompts }
  } catch (error: any) {
    return errorHandler(error)
  }
})
