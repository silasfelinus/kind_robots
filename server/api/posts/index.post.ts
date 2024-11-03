// /server/api/posts/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import type { Prisma, Post } from '@prisma/client'

export default defineEventHandler(async (event) => {
  try {
    // Validate authorization token
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

    const authenticatedUserId = user.id

    // Read and validate the post data from the request body
    const postData = await readBody(event)

    // Check if userId in postData matches the authenticated user
    if (postData.userId && postData.userId !== authenticatedUserId) {
      throw createError({
        statusCode: 403,
        message: 'User ID does not match the authenticated user.',
      })
    }

    // Create the post
    const result = await addPost({ ...postData, userId: authenticatedUserId })

    if (result.error) {
      return {
        success: false,
        message: result.error,
        statusCode: 400, // Indicating a client error due to incomplete or malformed data
      }
    }

    // Set status code to 201 Created for successful creation
    event.node.res.statusCode = 201
    return { success: true, post: result.post }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      message: 'Failed to create a new post.',
      error: message,
      statusCode: event.node.res.statusCode,
    }
  }
})

// Function to add a single post
export async function addPost(
  postData: Partial<Post>,
): Promise<{ post: Post | null; error: string | null }> {
  try {
    const post = await prisma.post.create({
      data: postData as Prisma.PostCreateInput,
    })
    return { post, error: null }
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    return { post: null, error: errorMessage }
  }
}
