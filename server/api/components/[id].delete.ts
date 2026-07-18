// server/api/components/[id].delete.ts
import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import { requireAdminApiUser } from '../../utils/authGuard'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let componentId: number | null = null

  try {
    await requireAdminApiUser(event)

    componentId = Number(event.context.params?.id)
    if (Number.isNaN(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Component ID. It must be a positive integer.',
      })
    }

    const deletedComponent = await prisma.component.delete({
      where: { id: componentId },
    })

    if (!deletedComponent) {
      throw createError({
        statusCode: 404,
        message: `Component with ID ${componentId} does not exist.`,
      })
    }

    response = {
      success: true,
      message: `Component with ID ${componentId} deleted successfully.`,
      data: {},
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error deleting component with ID "${componentId}":`,
      handledError,
    )

    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to delete component with ID ${componentId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
