// /server/api/random/[id].patch.ts
import { defineEventHandler, createError, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'
import { verifyJwtToken } from '../auth'

export default defineEventHandler(async (event) => {
  let id: number | null = null

  try {
    // Parse and validate the list ID from the URL params
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid list ID.',
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

    // Fetch the existing list to verify ownership
    const existingList = await prisma.randomList.findUnique({ where: { id } })
    if (!existingList) {
      throw createError({
        statusCode: 404,
        message: 'List not found.',
      })
    }

    // Verify ownership of the list
    if (existingList.userId !== verificationResult.userId) {
      throw createError({
        statusCode: 403,
        message: 'You do not have permission to update this list.',
      })
    }

    // Parse and validate the incoming request body
    const updatedListData = await readBody(event)
    if (!updatedListData || Object.keys(updatedListData).length === 0) {
      throw createError({
        statusCode: 400,
        message: 'No data provided for update.',
      })
    }

    if (updatedListData.title && typeof updatedListData.title !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Title must be a string.',
      })
    }

    if (updatedListData.items && !Array.isArray(updatedListData.items)) {
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

    // Return the updated list
    return { success: true, updatedList }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: false,
      message: handledError.message || `Failed to update list with ID ${id}.`,
      statusCode: handledError.statusCode || 500,
    }
  }
})
