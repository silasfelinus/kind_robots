// server/api/art/prompts/index.ts
import { ArtPrompt, Art } from '@prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { createArt } from './..'

// Define a type that matches the expected input for creating an ArtPrompt
export type ArtPromptCreateInput = {
  userId?: number
  prompt: string
  galleryId: number
}

export async function createArtPrompt(
  promptData: ArtPromptCreateInput
): Promise<{ newArtPrompt: ArtPrompt; newArt: Art | null }> {
  try {
    // Create new ArtPrompt
    const newArtPrompt = await prisma.artPrompt.create({
      data: promptData
    })

    let newArt: Art | null = null

    // Only generate art if path and galleryId are available
    if (promptData.prompt && (promptData.userId ?? promptData.galleryId)) {
      newArt = await createArt({
        path: 'some_path_here', // Replace with the actual path
        prompt: newArtPrompt.prompt,
        galleryId: promptData.galleryId // Use galleryId from ArtPrompt or default to 21
      })
    }

    return { newArtPrompt, newArt }
  } catch (error: any) {
    throw errorHandler(error)
  }
}
