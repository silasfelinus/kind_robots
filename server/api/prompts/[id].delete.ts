// /server/api/prompts/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id: number | undefined

  try {
    // Validate and parse the prompt ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Prompt ID. It must be a positive integer.',
      })
    }

    console.log(`Attempting to delete prompt with ID: ${id}`)

    // Extract and verify the authorization token
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

    // Check if the prompt exists and validate ownership
    const prompt = await prisma.prompt.findUnique({
      where: { id },
      select: { userId: true },
    })
    if (!prompt) {
      throw createError({
        statusCode: 404,
        message: `Prompt with ID ${id} does not exist.`,
      })
    }

    if (prompt.userId !== userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to delete this prompt.',
      })
    }

    // Proceed to delete the prompt
    await prisma.prompt.delete({ where: { id } })

    console.log(`Successfully deleted prompt with ID: ${id}`)
    response = {
      success: true,
      data: { message: `Prompt with ID ${id} successfully deleted.` },
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting prompt:', handledError)

    // Use `id` if it exists; otherwise, provide a generic message
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        (id
          ? `Failed to delete prompt with ID ${id}.`
          : 'Failed to delete prompt.'),
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
