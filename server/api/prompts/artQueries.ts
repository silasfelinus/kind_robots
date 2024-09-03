import prisma from '../utils/prisma'
import type { Prompt, Art } from '@prisma/client'
import { errorHandler } from '../utils/error'

export async function updatePrompt(
  id: number,
  updatedData: Partial<Prompt>,
): Promise<Prompt | null> {
  try {
    return await prisma.prompt.update({
      where: { id },
      data: updatedData,
    })
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.'
    console.error(`Error updating Prompt with id ${id}:`, errorMessage)
    throw errorHandler({ success: false, message: errorMessage })
  }
}

export async function fetchAllPrompts(): Promise<Prompt[]> {
  try {
    return await prisma.prompt.findMany()
  } catch (error: unknown) {
    console.error('Error fetching all prompts:', error)
    throw errorHandler(error)
  }
}

export async function fetchArtByPromptId(promptId: number): Promise<Art[]> {
  try {
    return await prisma.art.findMany({
      where: { promptId: promptId },
    })
  } catch (error: unknown) {
    console.error(`Error fetching Art by Prompt ID ${promptId}:`, error)
    throw errorHandler(error)
  }
}

export async function fetchPromptById(id: number): Promise<Prompt | null> {
  try {
    console.log(`Fetching Prompt by ID: ${id}`)
    const prompt = await prisma.prompt.findUnique({
      where: { id },
    })
    if (!prompt) {
      console.warn(`No Prompt found for ID: ${id}`)
    }
    return prompt
  } catch (error: unknown) {
    console.error(`Error fetching Prompt by ID ${id}:`, error)
    throw errorHandler(error)
  }
}
