// /server/api/prompts/index.post.ts
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
}

export default defineEventHandler(async (event) => {
  try {
    const promptData: PromptData = await readBody(event)

    const newPrompt = await createPrompt(promptData)
    return { success: true, newPrompt }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to create a new Prompt
export async function createPrompt(
  prompt: PromptData,
): Promise<Prompt> {
  try {
    // Validate required fields
    if (!prompt.prompt) {
      throw new Error('We need a prompt to make an art prompt.')
    }

    return await prisma.prompt.create({
      data: {
        userId: prompt.userId || 0,
        prompt: prompt.prompt,
        galleryId: prompt.galleryId || 0, // Set default value as 0
        pitch: prompt.pitch || null,
        pitchId: prompt.pitchId || null
      },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
