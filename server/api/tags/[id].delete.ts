import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error' // Import centralized error handler
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) throw new Error('Invalid tag ID.')

    const existingTag = await prisma.tag.findUnique({ where: { id } })
    if (!existingTag) {
      return { success: false, message: 'Tag not found.' }
    }

    await prisma.tag.delete({ where: { id } })
    return { success: true, message: 'Tag successfully deleted.' }
  }
  catch (error: unknown) {
    return errorHandler(error)
  }
})
