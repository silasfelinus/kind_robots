// server/api/art/prompts/index.ts
import { ArtPrompt, Art } from '@prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { createArt } from './..'

// Define a type that matches the expected input for creating an ArtPrompt
export type ArtPromptCreateInput = {
  userId?: number
  prompt: string
  galleryId?: number
}

export async function createArtPrompt(
  promptData: ArtPromptCreateInput
): Promise<{ newArtPrompt: ArtPrompt; newArt: Art | null }> {
  try {
    // Create new ArtPrompt
    const newArtPrompt = await prisma.artPrompt.create({
      data: promptData,
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        prompt: true,
        galleryId: true
      }
    })

    let newArt: Art | null = null

    // Only generate art if path and galleryId are available
    if (promptData.prompt && (promptData.userId ?? promptData.galleryId)) {
      newArt = await createArt({
        prompt: newArtPrompt.prompt,
        userId: newArtPrompt.userId,
        galleryId: newArtPrompt.galleryId ?? 21,
        artPromptId: newArtPrompt.id
      })
    }

    return { newArtPrompt, newArt }
  } catch (error: any) {
    throw errorHandler(error)
  }
}

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

export async function fetchAllArtPromptIds(): Promise<number[]> {
  try {
    const artPrompts = await prisma.artPrompt.findMany({
      select: {
        id: true
      }
    })
    return artPrompts.map((ap) => ap.id)
  } catch (error: any) {
    throw errorHandler(error)
  }
}
