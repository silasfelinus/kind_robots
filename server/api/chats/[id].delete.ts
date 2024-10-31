import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const userId = event.context.user?.id // Assuming user ID is added to the request context

    if (!userId) {
      return errorHandler({
        success: false,
        message: 'User not authenticated.',
        statusCode: 401,
      })
    }

    const isDeleted = await deleteChat(id, userId)
    if (isDeleted) {
      return { success: true }
    } else {
      // if `deleteChat` fails silently, return a generic error
      return errorHandler({
        success: false,
        message: 'Deletion failed due to authorization or missing chat.',
        statusCode: 403,
      })
    }
  } catch (error: unknown) {
    console.error("Error in deleteChat handler:", error)
    return errorHandler({
      success: false,
      message: `Error in deleteChat: ${error instanceof Error ? error.message : 'Unknown error'}`,
      statusCode: 500,
    })
  }
})

// Function to delete a chat by ID with user authorization
export async function deleteChat(id: number, userId: number): Promise<boolean> {
  try {
    // Check if chat exists
    const chatExchange = await prisma.chatExchange.findUnique({ where: { id } })

    if (!chatExchange) {
      console.error(`Chat with id ${id} not found`)
      errorHandler({
        success: false,
        message: 'Exchange not found.',
        statusCode: 404,
      })
      return false
    }

    // Verify the user owns this chat
    if (chatExchange.userId !== userId) {
      console.error(`Unauthorized deletion attempt by user ${userId} on chat ${id}`)
      errorHandler({
        success: false,
        message: 'You are not authorized to delete this exchange.',
        statusCode: 403,
      })
      return false
    }

    // Proceed to delete if authorized
    await prisma.chatExchange.delete({ where: { id } })
    console.log(`Chat with id ${id} successfully deleted by user ${userId}`)
    return true
  } catch (error: unknown) {
    console.error("Error in deleteChat function:", error)
    throw errorHandler({
      success: false,
      message: `Error deleting exchange: ${error instanceof Error ? error.message : 'Unknown error'}`,
      statusCode: 500,
    })
  }
}
