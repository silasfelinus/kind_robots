import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

// Event handler for deleting a prompt by ID
export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return {
        success: false,
        message: 'Invalid ID format.',
        statusCode: 400, // Bad Request
      }
    }

    console.log(`Attempting to delete Prompt with ID: ${id}`)

    // Attempt to delete the prompt
    const deletedPrompt = await deletePromptById(id)

    if (!deletedPrompt) {
      console.warn(`Prompt with ID ${id} not found or already deleted`)
      return {
        success: false,
        message: 'Prompt not found',
        statusCode: 404, // Not Found
      }
    }

    console.log(`Successfully deleted Prompt with ID: ${id}`)

    return { success: true, message: 'Prompt successfully deleted' }
  } catch (error: unknown) {
    console.error('Error deleting prompt:', error)
    // Use the errorHandler to process the error
    return errorHandler({
      error,
      context: 'Deleting Prompt by ID',
    })
  }
})

// Function to delete a prompt by ID
async function deletePromptById(id: number): Promise<boolean> {
  try {
    const promptExists = await prisma.prompt.findUnique({
      where: { id },
    })

    if (!promptExists) {
      console.warn(`Prompt with ID ${id} does not exist`)
      return false
    }

    await prisma.prompt.delete({
      where: { id },
    })

    return true
  } catch (error: unknown) {
    console.error(`Error during deletion of Prompt with ID ${id}:`, error)
    throw errorHandler({
      error,
      context: 'Deleting Prompt by ID',
    })
  }
}
