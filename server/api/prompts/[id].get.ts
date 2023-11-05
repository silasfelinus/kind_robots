// server/api/art/prompts/[id].get.ts
import { defineEventHandler } from 'h3'
import { type ArtPrompt, type Art } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const artPrompt = await fetchArtPromptById(id)
    if (!artPrompt) {
      return { success: false, message: 'ArtPrompt not found' }
    }
    const artIds = artPrompt.Art.map((a) => a.id)
    return { success: true, prompt: artPrompt.prompt, artIds }
  } catch (error: any) {
    return errorHandler(error)
  }
})

// Modify the return type to include the Art relationship
export async function fetchArtPromptById(id: number): Promise<(ArtPrompt & { Art: Art[] }) | null> {
  try {
    return await prisma.artPrompt.findUnique({
      where: { id },
      include: {
        Art: true // Include related Art
      }
    })
  } catch (error: any) {
    throw errorHandler(error)
  }
}
