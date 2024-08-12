import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    const isDeleted = await deleteMessage(id)
    return { success: isDeleted }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})

// Function to delete a Message by ID
export async function deleteMessage(id: number): Promise<boolean> {
  try {
    const messageExists = await prisma.message.findUnique({ where: { id } })

    if (!messageExists) {
      return false
    }

    await prisma.message.delete({ where: { id } })
    return true
  }
  catch (error: unknown) {
    throw errorHandler(error)
  }
}
