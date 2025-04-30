// /server/api/icons/[id].get.ts
import { defineEventHandler, createError } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'

export default defineEventHandler(async (event) => {
  let id
  let response

  try {
    id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid SmartIcon ID. It must be a positive integer.',
      })
    }

    const data = await prisma.smartIcon.findUnique({
      where: { id },
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: `SmartIcon with ID ${id} not found.`,
      })
    }

    response = {
      success: true,
      message: 'SmartIcon fetched successfully.',
      data,
      statusCode: 200,
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message:
        handledError.message || `Failed to fetch SmartIcon with ID ${id}.`,
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
