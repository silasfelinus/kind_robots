// /server/api/prompts/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

// Event handler for deleting a prompt by ID
export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Validate and parse the prompt ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Prompt ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete Prompt with ID: ${id}`)

    // Extract and verify the JWT token from the request
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401, // Unauthorized
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401, // Unauthorized
        message: 'Invalid or expired token.',
      })
    }

    // Check if the prompt exists and validate ownership
    const prompt = await prisma.prompt.findUnique({ where: { id } })
    if (!prompt) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Prompt with ID ${id} does not exist.`,
      })
    }

    if (prompt.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You do not have permission to delete this prompt.',
      })
    }

    // Proceed to delete the prompt
    const deleted = await deletePromptById(id)

    if (!deleted) {
      console.warn(`Prompt with ID ${id} could not be deleted (may not exist)`)
      throw createError({
        statusCode: 404, // Not Found
        message: `Prompt with ID ${id} was not found.`,
      })
    }

    console.log(`Successfully deleted Prompt with ID: ${id}`)
    return { success: true, message: 'Prompt successfully deleted' }
  } catch (error: unknown) {
    console.error('Error deleting prompt:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to delete prompt with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Function to delete a prompt by ID
async function deletePromptById(id: number): Promise<boolean> {
  try {
    const promptExists = await prisma.prompt.findUnique({ where: { id } })

    if (!promptExists) {
      console.warn(`Prompt with ID ${id} does not exist`)
      return false
    }

    await prisma.prompt.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    console.error(`Error during deletion of Prompt with ID ${id}:`, error)
    throw errorHandler({
      error,
      context: 'Deleting Prompt by ID',
    })
  }
}
