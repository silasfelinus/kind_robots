// /server/api/posts/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // 1. Validate and parse the post ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Post ID. It must be a positive integer.',
      })
    }

    console.log('Attempting to delete Post with ID:', id)

    // 2. Extract and verify the JWT token
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

    // 3. Fetch the post to verify ownership
    const post = await prisma.post.findUnique({ where: { id } })
    if (!post) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Post with ID ${id} does not exist.`,
      })
    }

    // 4. Check if the logged-in user is the owner of the post
    if (post.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403, // Forbidden
        message: 'You are not authorized to delete this post.',
      })
    }

    // 5. Proceed to delete the post
    await prisma.post.delete({ where: { id } })

    console.log(
      `Post with ID ${id} successfully deleted by user ${verificationResult.userId}`,
    )
    return {
      success: true,
      message: `Post with ID ${id} successfully deleted.`,
    }
  } catch (error: unknown) {
    console.error('Error while deleting Post:', error)
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to delete Post with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
