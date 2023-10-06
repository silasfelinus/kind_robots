import { defineEventHandler, readBody } from 'h3'
import { ArtPrompt } from '@prisma/client'
import { errorHandler } from '../utils/error'

export type ArtPromptCreateInput = {
  userId: number
  prompt: string
  galleryId: number
  pitch?: string
  pitchId?: number
}

export default defineEventHandler(async (event) => {
  try {
    // Read the request body and cast it to the ArtPromptCreateInput type
    const promptData: ArtPromptCreateInput = await readBody(event)

    // Create a new ArtPrompt using the createArtPrompt function
    const newArtPrompt = await createArtPrompt(promptData)

    // Return success along with the new ArtPrompt
    return { success: true, newArtPrompt }
  } catch (error: any) {
    // Handle errors using the centralized error handler
    return errorHandler({ error, context: 'ArtPrompt Creation' })
  }
})

export async function createArtPrompt(promptData: Partial<ArtPrompt>): Promise<ArtPrompt> {
  try {
    // Define default values for all expected fields
    const defaultData: ArtPrompt = {
      id: 0, // This will be auto-incremented by Prisma
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 0,
      prompt: '',
      galleryId: 21,
      pitch: '',
      pitchId: null
      // Art and Gallery fields are relational and should not be set here
    }

    // Merge the default values with the provided data
    const completeData = { ...defaultData, ...promptData }

    // Create new ArtPrompt
    const newArtPrompt = await prisma.artPrompt.create({
      data: completeData
    })

    return newArtPrompt
  } catch (error: any) {
    const errorHandlerInput = {
      success: false,
      message: `Art Generation - Prompt: ${promptData.prompt}, User: ${promptData.userId}`,
      error
    }
    errorHandler(errorHandlerInput)
    throw new Error('Failed to create ArtPrompt') // This will stop the function execution
  }
}
