// server/api/components/[id].get.ts
import { createError, defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'
import { getOptionalApiUser } from '../../utils/authGuard'
import { projectComponentForViewer } from '../../utils/componentProjection'

export default defineEventHandler(async (event) => {
  let response
  let componentId: number | null = null

  try {
    componentId = Number(event.context.params?.id)
    if (Number.isNaN(componentId) || componentId <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid Component ID. It must be a positive integer.',
      })
    }

    const [data, auth] = await Promise.all([
      prisma.component.findUnique({
        where: { id: componentId },
      }),
      getOptionalApiUser(event),
    ])

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Component with ID ${componentId} does not exist.`,
      })
    }

    response = {
      success: true,
      data: projectComponentForViewer(data, auth?.isAdmin === true),
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error(
      `Error fetching component with ID "${componentId}":`,
      handledError,
    )

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
