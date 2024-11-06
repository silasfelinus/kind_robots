// /server/api/random/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    // Validate and parse the ID from the URL parameters
    const id = Number(event.context.params?.id)
    if (isNaN(id) || id <= 0) {
      return {
        success: false,
        message: 'Invalid ID. It must be a positive integer.',
        statusCode: 400,
      }
    }

    // Fetch the random list by ID
    const list = await prisma.randomList.findUnique({ where: { id } })
    if (!list) {
      return {
        success: false,
        message: 'List not found.',
        statusCode: 404,
      }
    }

    // Successful response with the found list
    return {
      success: true,
      data: { list }, // Wrap the list in a data property
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    return {
      success: handledError.success,
      message: handledError.message,
      statusCode: handledError.statusCode,
    }
  }
})
