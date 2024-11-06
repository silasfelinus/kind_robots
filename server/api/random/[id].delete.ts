// /server/api/random/[id].delete.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let id

  try {
    // Validate and parse the item ID
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      return {
        success: false,
        message: 'Invalid ID. It must be a positive integer.',
        statusCode: 400,
      }
    }

    console.log(`Attempting to delete item with ID: ${id}`)

    // Extract and verify the authorization token
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

    // Fetch the item to verify ownership
    const item = await prisma.randomList.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!item) {
      return {
        success: false,
        message: `Item with ID ${id} does not exist.`,
        statusCode: 404,
      }
    }

    // Ensure the user owns this item
    if (item.userId !== userId) {
      return {
        success: false,
        message: 'You do not have permission to delete this item.',
        statusCode: 403,
      }
    }

    // Delete the item
    await prisma.randomList.delete({ where: { id } })

    console.log(`Successfully deleted item with ID: ${id}`)

    // Successful deletion response
    response = {
      success: true,
      message: `Item with ID ${id} successfully deleted.`,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error deleting item:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to delete item with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
