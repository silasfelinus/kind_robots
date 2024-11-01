// /server/api/posts/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma, Post } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  let response

  try {
    // Parse and validate the post ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid post ID.',
      })
    }

    // Extract and validate the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message:
          'Authorization token is required in the format "Bearer <token>".',
      })
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      event.node.res.statusCode = 401
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the existing post to verify ownership
    const existingPost = await prisma.post.findUnique({ where: { id } })
    if (!existingPost) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'Post not found.',
      })
    }

    // Verify ownership of the post
    if (existingPost.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this post.',
      })
    }

    // Parse the incoming request body as partial post data
    const postData: Prisma.PostUpdateInput = await readBody(event)
    if (!postData || Object.keys(postData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the post in the database
    const updatedPost = await updatePost(id, postData)

    // Success response with updated post
    response = {
      success: true,
      post: updatedPost,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update post with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})

// Function to update an existing Post by ID
export async function updatePost(
  id: number,
  updatedPost: Prisma.PostUpdateInput,
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
