// /server/api/artPrompts/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { ArtPrompt } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

// Define a TypeScript interface for the expected ArtPrompt data
interface ArtPromptData {
  userId?: number
  prompt: string
  galleryId?: number
  pitch?: string
  pitchId?: number
  DB_ROW_HASH_1: bigint
}

export default defineEventHandler(async (event) => {
  try {
    const artPromptData: ArtPromptData = await readBody(event)

    const newArtPrompt = await createArtPrompt(artPromptData)
    return { success: true, newArtPrompt }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to create a new ArtPrompt
export async function createArtPrompt(artPrompt: ArtPromptData): Promise<ArtPrompt> {
  try {
    // Validate required fields
    if (!artPrompt.prompt) {
      throw new Error('We need a prompt to make an art prompt.')
    }

    return await prisma.artPrompt.create({
      data: {
        userId: artPrompt.userId || 0,
        prompt: artPrompt.prompt,
        galleryId: artPrompt.galleryId || 0, // Set default value as 0
        pitch: artPrompt.pitch || null,
        pitchId: artPrompt.pitchId || null,
        DB_ROW_HASH_1: artPrompt.DB_ROW_HASH_1 // Ensure DB_ROW_HASH_1 is included
      },
    })
  }
  catch (error: unknown) {
    throw errorHandler(error)
  }
}
