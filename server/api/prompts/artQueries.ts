// /server/api/art/prompts/artQueries.ts
import prisma from '../utils/prisma'
import type { Prompt } from '@prisma/client'
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
    // Type guard to ensure error is an instance of Error
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
    throw errorHandler(error)
  }
}

export async function fetchArtByPromptId(promptId: number): Promise<Art[]> {
  try {
    return await prisma.art.findMany({
      where: { promptId: promptId },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}

export async function fetchPromptById(
  id: number,
): Promise<Prompt | null> {
  try {
    return await prisma.prompt.findUnique({
      where: { id },
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
