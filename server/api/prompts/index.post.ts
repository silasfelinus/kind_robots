// /server/api/prompts/index.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { Prompt } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const promptData: Prompt = await readBody(event)

    const newPrompt = await createPrompt(promptData)
    return { success: true, newPrompt }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
export async function createPrompt(prompt: Prompt): Promise<Prompt> {
  try {
    // Validate required fields
    if (!prompt.prompt) {
      throw new Error('The "prompt" field is required.')
    }

    return await prisma.prompt.create({
      data: {
        userId: prompt.userId || 10,
        prompt: prompt.prompt,
        galleryId: prompt.galleryId || null,
        pitchId: prompt.pitchId || null,
        botId: prompt.botId || null,
      },
    })
  } catch (error: unknown) {
    console.error('Error occurred while creating prompt:', error)
    throw errorHandler(error)
  }
}
