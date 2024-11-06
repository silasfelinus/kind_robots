// /server/api/random/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the list ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      return {
        success: false,
        message: 'Invalid list ID. It must be a positive integer.',
        statusCode: 400,
      }
    }

    // Extract and validate the API key from the Authorization header
    const authorizationHeader = event.node.req.headers['authorization']
    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      return {
        success: false,
        message:
          'Authorization token is required in the format "Bearer <token>".',
        statusCode: 401,
      }
    }

    const token = authorizationHeader.split(' ')[1]
    const user = await prisma.user.findFirst({
      where: { apiKey: token },
      select: { id: true },
    })

    if (!user) {
      return {
        success: false,
        message: 'Invalid or expired token.',
        statusCode: 401,
      }
    }

    const userId = user.id

    // Fetch the existing list to verify ownership
    const existingList = await prisma.randomList.findUnique({ where: { id } })
    if (!existingList) {
      return {
        success: false,
        message: 'List not found.',
        statusCode: 404,
      }
    }

    // Verify ownership of the list
    if (existingList.userId !== userId) {
      return {
        success: false,
        message: 'You do not have permission to update this list.',
        statusCode: 403,
      }
    }

    // Parse and validate the incoming request body
    const updatedListData = await readBody(event)
    if (!updatedListData || Object.keys(updatedListData).length === 0) {
      return {
        success: false,
        message: 'No data provided for update.',
        statusCode: 400,
      }
    }

    if (updatedListData.title && typeof updatedListData.title !== 'string') {
      return {
        success: false,
        message: 'Title must be a string.',
        statusCode: 400,
      }
    }

    if (updatedListData.items && !Array.isArray(updatedListData.items)) {
      return {
        success: false,
        message: 'Items must be an array.',
        statusCode: 400,
      }
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
    return {
      success: true,
      data: { updatedList },
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to update list with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
