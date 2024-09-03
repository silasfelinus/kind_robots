// /server/api/resources/[id].get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return { success: false, message: 'Invalid ID', statusCode: 400 }
    }

    const resource = await prisma.resource.findUnique({
      where: { id },
    })

    if (!resource) {
      return { success: false, message: 'Resource not found', statusCode: 404 }
    }

    return { success: true, resource }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
