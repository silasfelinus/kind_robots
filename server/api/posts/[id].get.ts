// /server/api/posts/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let response
  let id: number | null = null

  try {
    // Parse and validate the post ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Post ID. It must be a positive integer.',
      })
    }

    // Fetch the post from the database
    const post = await prisma.post.findUnique({
      where: { id },
    })

    if (!post) {
      throw createError({
        statusCode: 404,
        message: 'Post not found.',
      })
    }

    // Successful response with the post data
    response = {
      success: true,
      post,
      message: 'Post retrieved successfully.',
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error while fetching Post:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to fetch Post with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
