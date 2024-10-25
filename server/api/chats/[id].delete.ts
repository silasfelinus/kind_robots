import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteChat(id)
    return { success: isDeleted }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to delete a chat by ID
export async function deleteChat(id: number): Promise<boolean> {
  try {
    const chatExists = await prisma.chatExchange.findUnique({ where: { id } })

    if (!chatExists) {
      return false
    }

    await prisma.chatExchange.delete({ where: { id } })
    return true
  } catch (error: unknown) {
    throw errorHandler(error)
  }
}
