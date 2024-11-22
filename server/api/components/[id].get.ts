// server/api/components/[id].get.ts
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

    // Fetch the component from the database
    const data = await prisma.component.findUnique({
      where: { id: componentId },
    })

    if (!data) {
      throw createError({
        statusCode: 404, // Not Found
        message: `Component with ID ${componentId} does not exist.`,
      })
    }

    // Return the component data in the expected response format
    response = {
      success: true,
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error fetching component with ID "${componentId}":`,
      handledError,
    )

    // Set the appropriate status code and response based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message ||
        `Failed to fetch component with ID ${componentId}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
