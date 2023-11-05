// server/api/art/prompts/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { type ArtPrompt } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

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

export async function updateArtPrompt(
  id: number,
  updatedData: Partial<ArtPrompt>
): Promise<ArtPrompt | null> {
  try {
    const updatedPrompt = await prisma.artPrompt.update({
      where: { id },
      data: updatedData
    })
    return updatedPrompt
  } catch (error: any) {
    errorHandler({ success: false, message: error.message })
    return null
  }
}
