// /server/api/posts/index.post.ts
import { defineEventHandler, readBody, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'
import { Prisma, type Post } from '@prisma/client'
import { validateApiKey } from '../utils/validateKey' // Import validateApiKey

export default defineEventHandler(async (event) => {
  try {
    // Validate the API key using the utility function
    const { isValid, user } = await validateApiKey(event)
    if (!isValid || !user) {
      throw createError({
        statusCode: 401,
        message: 'Invalid or expired token.',
      })
    }

    const authenticatedUserId = user.id

    // Read and validate the post data from the request body
    const postData = await readBody<Partial<Post>>(event)

    // Check for required fields and provide specific error messages
    const requiredFields = ['title', 'content']
    const missingFields = requiredFields.filter(
      (field) => !postData[field as keyof Post],
    )
    if (missingFields.length > 0) {
      throw createError({
        statusCode: 400,
        message: `Missing required fields: ${missingFields.join(', ')}.`,
      })
    }

    // Add authenticated userId to postData to ensure ownership
    postData.userId = authenticatedUserId

    // Create the post, ensuring required fields and userId are included
    const result = await addPost(postData)

    if (result.error) {
      throw createError({
        statusCode: 400,
        message: result.error,
      })
    }

    // Set status code to 201 Created for successful creation
    event.node.res.statusCode = 201
    return {
      success: true,
      data: { post: result.post },
      message: 'Post created successfully.',
    }
  } catch (error) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500
    return {
      success: false,
      data: null, // Ensure data is always returned for consistency
      message:
        message.includes('token') || message.includes('Missing required fields')
          ? message
          : 'Failed to create a new post.',
      error: message,
      statusCode: statusCode || 500,
    }
  }
})

// Function to add a single post with enhanced error reporting
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
      error instanceof Error
        ? error.message
        : 'An unknown error occurred while creating the post.'

    // Handle specific Prisma errors for more detail
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Unique constraint failed
        return { post: null, error: 'A post with this title already exists.' }
      }
    }

    return { post: null, error: errorMessage }
  }
}
