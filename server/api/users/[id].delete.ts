// server/api/users/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'
import prisma from '../utils/prisma'
import auth from '../../middleware/auth'

export default defineEventHandler(async (event) => {
  let userId: number | null = null

  try {
    console.log('User deletion endpoint invoked.')

    event.context.route = { auth: true } // This line sets the auth property
    auth(event)

    // Extract and validate the user ID
    userId = Number(event.context.params?.id)
    if (isNaN(userId) || userId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid User ID. ID must be a positive integer.',
      })
    }

    // Extract and verify the JWT token
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
    if (!verificationResult || verificationResult.userId !== userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'Unauthorized to delete this user.',
      })
    }

    // Attempt to delete the user
    const deleted = await deleteUser(userId)
    if (!deleted) {
      throw createError({
        statusCode: 404, // Not Found
        message: `User with ID ${userId} does not exist.`,
      })
    }

    console.log(`Successfully deleted user with ID: ${userId}`)
    return {
      success: true,
      message: `User with ID ${userId} successfully deleted.`,
    }
  } catch (error: unknown) {
    console.error('Error deleting user:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message:
        handledError.message || `Failed to delete user with ID ${userId}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Function to delete a user by ID
async function deleteUser(id: number): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      console.error(`User with ID ${id} does not exist.`)
      return false
    }

    await prisma.user.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    console.error(`Failed to delete user: ${(error as Error).message}`)
    throw errorHandler(error)
  }
}
