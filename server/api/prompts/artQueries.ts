// /server/api/art/prompts/artQueries.ts
import prisma from '../utils/prisma'
import type { ArtPrompt } from '@prisma/client'
import { errorHandler } from '../utils/error'

export async function updateArtPrompt(id: number, updatedData: Partial<ArtPrompt>): Promise<ArtPrompt | null> {
  try {
    return await prisma.artPrompt.update({
      where: { id },
      data: updatedData,
    })
  } catch (error: unknown) {
    // Type guard to ensure error is an instance of Error
    const errorMessage = (error instanceof Error) ? error.message : 'An unknown error occurred.'
    console.error(`Error updating ArtPrompt with id ${id}:`, errorMessage)
    throw errorHandler({ success: false, message: errorMessage })
  }
}

export async function fetchAllArtPrompts(): Promise<ArtPrompt[]> {
    try {
      return await prisma.artPrompt.findMany()
    }
    catch (error: unknown) {
      throw errorHandler(error)
    }
  }
  
  export async function fetchArtByPromptId(promptId: number): Promise<Art[]> {
    try {
      return await prisma.art.findMany({
        where: { artPromptId: promptId },
      })
    }
    catch (error: unknown) {
      throw errorHandler(error)
    }
  }

  export async function fetchArtPromptById(id: number): Promise<ArtPrompt | null> {
    try {
      return await prisma.artPrompt.findUnique({
        where: { id },
      });
    } 
    catch (error: unknown) {
      throw errorHandler(error)
    }
  }