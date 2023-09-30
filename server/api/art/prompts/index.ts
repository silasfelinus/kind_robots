// server/api/art/prompts/index.ts
import { ArtPrompt, Art } from '@prisma/client'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'

// Define a type that matches the expected input for creating an ArtPrompt

export type ArtPromptCreateInput = {
  userId: number
  prompt: string
  galleryId: number
  pitch: string
}

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
export async function createArtPrompt(promptData: ArtPromptCreateInput): Promise<ArtPrompt> {
  try {
    // Create new ArtPrompt
    const newArtPrompt = await prisma.artPrompt.create({
      data: promptData
    })
    return newArtPrompt
  } catch (error: any) {
    console.error('Prompt Generation Error:', error)
    throw errorHandler({
      error,
      context: `Art Generation - Prompt: ${promptData.prompt}, User: ${promptData.userId}`
    })
  }
}

// Fetch all ArtPrompts along with their related Art
export async function fetchAllArtPrompts(): Promise<(ArtPrompt & { Art: Art[] })[]> {
  try {
    return await prisma.artPrompt.findMany({
      include: {
        Art: true // Include related Art
      }
    })
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
export type { ArtPrompt }
