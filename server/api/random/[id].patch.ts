// /server/api/random/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let id: number | null = null
  let response

  try {
    // Parse and validate the list ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Invalid list ID.',
      })
    }

    // Extract and validate the API key from the Authorization header
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

    // Fetch the existing list to verify ownership
    const existingList = await prisma.randomList.findUnique({ where: { id } })
    if (!existingList) {
      event.node.res.statusCode = 404
      throw createError({
        statusCode: 404,
        message: 'List not found.',
      })
    }

    // Verify ownership of the list
    if (existingList.userId !== userId) {
      event.node.res.statusCode = 403
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this list.',
      })
    }

    // Parse and validate the incoming request body
    const updatedListData = await readBody(event)
    if (!updatedListData || Object.keys(updatedListData).length === 0) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    if (updatedListData.title && typeof updatedListData.title !== 'string') {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Title must be a string.',
      })
    }

    if (updatedListData.items && !Array.isArray(updatedListData.items)) {
      event.node.res.statusCode = 400
      throw createError({
        statusCode: 400,
        message: 'Items must be an array.',
      })
    }

    // Update the list in the database
    const updatedList = await prisma.randomList.update({
      where: { id },
      data: {
        ...updatedListData,
        items: updatedListData.items
          ? JSON.stringify(updatedListData.items)
          : undefined,
      },
    })

    // Success response with updated list
    response = {
      success: true,
      updatedList,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to update list with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
