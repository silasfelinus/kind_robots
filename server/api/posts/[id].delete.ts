// /server/api/posts/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id

  try {
    // Validate and parse the post ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid Post ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete Post with ID: ${id}`)

    // Extract and verify the authorization token
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

    // Fetch the post entry and verify ownership
    const post = await prisma.post.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!post) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: `Post with ID ${id} does not exist.`,
      })
    }

    if (post.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You are not authorized to delete this post.',
      })
    }

    // Proceed to delete the post
    await prisma.post.delete({ where: { id } })

    console.log(`Successfully deleted Post with ID: ${id}`)
    response = {
      success: true,
      message: `Post with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error while deleting Post:', handledError)

    // Explicitly set the status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete Post with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
