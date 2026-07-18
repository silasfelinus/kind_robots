// /server/api/prompts/[id].get.ts
import { createError, defineEventHandler } from 'h3'
import prisma from '../../utils/prisma'
import { errorHandler } from '../../utils/error'
import { promptResourceSelect } from './selects'

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)

    if (!Number.isInteger(id) || id <= 0) {
      throw createError({
        statusCode: 400,
        message: 'Invalid prompt ID. It must be a positive integer.',
      })
    }

    const data = await prisma.prompt.findUnique({
      where: { id },
      select: promptResourceSelect,
    })

    if (!data) {
      throw createError({
        statusCode: 404,
        message: 'Prompt not found.',
      })
    }

    event.node.res.statusCode = 200

    return {
      success: true,
      data,
      message: 'Prompt fetched successfully.',
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    event.node.res.statusCode = statusCode || 500

    return {
      success: false,
      data: null,
      message: message || 'Failed to fetch prompt.',
      statusCode: event.node.res.statusCode,
    }
  }
})
