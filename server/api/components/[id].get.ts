import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) {
      throw new Error('Invalid ID.')
    }

    const component = await prisma.component.findUnique({
      where: { id },
    })

    if (!component) {
      throw new Error('Component not found.')
    }

    return {
      success: true,
      component,
    }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
