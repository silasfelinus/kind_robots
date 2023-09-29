// server/api/art/prompts/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { ArtPrompt, updateArtPrompt } from '.'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const updatedPromptData: Partial<ArtPrompt> = await readBody(event)
    const updatedPrompt = await updateArtPrompt(id, updatedPromptData)
    return { success: true, updatedPrompt }
  } catch (error: any) {
    return errorHandler(error)
  }
})
