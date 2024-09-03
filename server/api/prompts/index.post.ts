// /server/api/artPrompts/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prompt } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

// Define a TypeScript interface for the expected Prompt data
interface PromptData {
  userId?: number
  prompt: string
  galleryId?: number
  pitch?: string
  pitchId?: number
  DB_ROW_HASH_1: bigint
}

export default defineEventHandler(async (event) => {
  try {
    const artPromptData: PromptData = await readBody(event)

    const newPrompt = await createPrompt(artPromptData)
    return { success: true, newPrompt }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to create a new Prompt
export async function createPrompt(
  artPrompt: PromptData,
): Promise<Prompt> {
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
        DB_ROW_HASH_1: artPrompt.DB_ROW_HASH_1, // Ensure DB_ROW_HASH_1 is included
      },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
