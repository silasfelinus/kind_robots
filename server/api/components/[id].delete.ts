// server/api/components/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'

export default defineEventHandler(async (event) => {
  let componentId: number | null = null

  try {
    await requireAdminApiUser(event)

    componentId = Number(event.context.params?.id)

    if (!Number.isInteger(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid component ID. It must be a positive integer.',
      })
    }

    const existing = await prisma.component.findUnique({
      where: { id: componentId },
      select: { id: true },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        message: `Component with ID ${componentId} does not exist.`,
      })
    }

    await prisma.component.delete({
      where: { id: componentId },
    })

    event.node.res.statusCode = 200

    return {
      success: true,
      message: `Component with ID ${componentId} deleted successfully.`,
      data: null,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handled = errorHandler(error)
    const statusCode = handled.statusCode || 500

    if (statusCode >= 500) {
      console.error(`Component delete failed for ID ${componentId}:`, handled)
    }

    event.node.res.statusCode = statusCode

    return {
      success: false,
      message:
        handled.message || `Failed to delete component with ID ${componentId}.`,
      data: null,
      statusCode,
    }
  }
})
