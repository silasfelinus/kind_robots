// /server/api/random/[id].delete.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (isNaN(id)) {
      throw new Error('Invalid ID.')
    }

    const deletedItem = await prisma.randomList.delete({ where: { id } })

    if (!deletedItem) {
      return {
        success: false,
        message: 'Item not found or could not be deleted.',
      }
    }

    return {
      success: true,
      message: `Item with ID ${id} successfully deleted.`,
    }
  } catch (error: unknown) {
    const { success, message, statusCode } = errorHandler(error)
    return { success, message, statusCode }
  }
})
