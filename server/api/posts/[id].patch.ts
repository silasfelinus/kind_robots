// /server/api/posts/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import type { Prisma, Post } from '@prisma/client'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null

  try {
    // Parse and validate the post ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid post ID. It must be a positive integer.',
      })
    }

    // Extract and validate the authorization token
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
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
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const userId = user.id

    // Fetch the existing post to verify ownership
    const existingPost = await prisma.post.findUnique({
      where: { id },
    })
    if (!existingPost) {
      throw createError({
        statusCode: 404,
        message: 'Post not found.',
      })
    }

    // Verify ownership of the post
    if (existingPost.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this post.',
      })
    }

    // Parse the incoming request body as partial post data
    const postData: Prisma.PostUpdateInput = await readBody(event)
    if (!postData || Object.keys(postData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    // Update the post in the database
    const updatedPost = await updatePost(id, postData)

    // Successful response with updated post
    response = {
      success: true,
      post: updatedPost,
      message: `Post with ID ${id} updated successfully.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error while updating Post:', handledError)

    // Set the response and status code based on the handled error
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
