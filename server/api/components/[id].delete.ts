// server/api/components/[id].delete.ts
import { defineEventHandler, createError } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response
  let componentId: number | null = null

  try {
    // Validate and parse the component ID
    componentId = Number(event.context.params?.id)
    if (isNaN(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400, // Bad Request
        message: 'Invalid Component ID. It must be a positive integer.',
      })
    }

    // Attempt to delete the component by ID
    const deletedComponent = await prisma.component.delete({
      where: { id: componentId },
    })

    if (!deletedComponent) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Component with ID ${componentId} does not exist.`,
      })
    }

    // Successful deletion response
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

    // Set the appropriate status code and response based on the handled error
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
