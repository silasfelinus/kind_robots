// /server/api/random/title/[title].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    // Extract the title from the URL parameters
    const title = event.context.params?.title
    if (!title) {
      return {
        success: false,
        message: 'Title is required.',
        statusCode: 400, // Bad Request
      }
    }

    // Find the random list by title
    const list = await prisma.randomList.findUnique({
      where: { title },
    })

    if (!list) {
      return {
        success: false,
        message: 'List not found.',
        statusCode: 404, // Not Found
      }
    }

    // Successful response
    response = {
      success: true,
      message: 'List retrieved successfully.',
      data: { list },
      statusCode: 200, // OK
    }
    event.node.res.statusCode = 200
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error fetching random list by title:', handledError)

    // Set the response and status code based on the handled error
    event.node.res.statusCode = handledError.statusCode || 500
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch the list.',
      statusCode: event.node.res.statusCode,
    }
  }

  return response
})
