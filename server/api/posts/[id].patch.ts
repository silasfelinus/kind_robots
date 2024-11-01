// /server/api/posts/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Post } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the post ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid post ID.',
      })
    }

    // Extract and validate the JWT token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const verificationResult = await verifyJwtToken(token)
    if (!verificationResult || !verificationResult.userId) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    // Fetch the existing post to verify ownership
    const existingPost = await prisma.post.findUnique({ where: { id } })
    if (!existingPost) {
      throw createError({
        statusCode: 404,
        message: 'Post not found.',
      })
    }

    // Verify ownership of the post
    if (existingPost.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this post.',
      })
    }

    // Parse the incoming request body as partial post data
    const postData: Partial<Post> = await readBody(event)
    if (!postData || Object.keys(postData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the post in the database
    const updatedPost = await updatePost(id, postData)

    // Return the updated post
    return {
      success: true,
      post: updatedPost,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to update post with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})

// Function to update an existing Post by ID
export async function updatePost(
  id: number,
  updatedPost: Partial<Post>,
): Promise<Post | null> {
  try {
    return await prisma.post.update({
      where: { id },
      data: updatedPost,
    })
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
