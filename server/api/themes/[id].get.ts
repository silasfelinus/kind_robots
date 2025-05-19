// /server/api/themes/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from '@/server/api/utils/prisma'
import { errorHandler } from '@/server/api/utils/error'

export default defineEventHandler(async (event) => {
  let id
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid theme ID. It must be a positive integer.',
      })
    }

    const data = await prisma.theme.findUnique({
      where: { id },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `Theme with ID ${id} not found.`,
      })
    }

    event.node.res.statusCode = 200
    response = {
      success: true,
      message: 'Theme fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || `Failed to fetch theme with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
