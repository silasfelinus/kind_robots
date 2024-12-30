import prisma from '../utils/prisma'
import type { Prompt, Art } from '@prisma/client'
import { errorHandler } from '../utils/error'
import { createError } from 'h3' // Ensure createError is imported for specific error handling

export async function updatePrompt(
  id: number,
  updatedData: Partial<Prompt>,
): Promise<Prompt | null> {
  try {
    const updatedPrompt = await prisma.prompt.update({
      where: { id },
      data: updatedData,
    })
    return updatedPrompt
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'An unknown error occurred during prompt update.'
    console.error(`Error updating Prompt with ID ${id}:`, errorMessage)
    throw errorHandler({
      success: false,
      message: `Failed to update Prompt with ID ${id}: ${errorMessage}`,
      statusCode: 500,
    })
  }
}

export async function fetchAllPrompts(): Promise<Prompt[]> {
  try {
    const prompts = await prisma.prompt.findMany()
    return prompts
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.'
    console.error('Error fetching all prompts:', errorMessage)
    throw errorHandler({
      success: false,
      message: `Failed to fetch all prompts: ${errorMessage}`,
      statusCode: 500,
    })
  }
}

export async function fetchArtByPromptId(promptId: number): Promise<Art[]> {
  try {
    const artPieces = await prisma.art.findMany({
      where: { promptId },
    })
    return artPieces
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.'
    console.error(`Error fetching Art by Prompt ID ${promptId}:`, errorMessage)
    throw errorHandler({
      success: false,
      message: `Failed to fetch Art for Prompt ID ${promptId}: ${errorMessage}`,
      statusCode: 500,
    })
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
      throw createError({
        statusCode: 404,
        message: `Prompt with ID ${id} not found.`,
      })
    }
    return prompt
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred.'
    console.error(`Error fetching Prompt by ID ${id}:`, errorMessage)
    throw errorHandler({
      success: false,
      message: `Failed to fetch Prompt with ID ${id}: ${errorMessage}`,
      statusCode: 500,
    })
  }
}
