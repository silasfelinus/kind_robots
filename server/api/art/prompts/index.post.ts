import { defineEventHandler, readBody } from 'h3'
import { errorHandler } from '../../utils/error'
import { createArtPrompt, ArtPromptCreateInput } from '.'

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
