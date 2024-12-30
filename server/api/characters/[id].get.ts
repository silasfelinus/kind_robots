import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  let response

  try {
    const id = Number(event.context.params?.id)

    if (isNaN(id)) {
      return {
        success: false,
        message: 'Invalid ID',
        statusCode: 400,
      }
    }

    // Fetch the character by ID
    const data = await prisma.character.findUnique({
      where: { id },
    })
    if (!data) {
      return {
        success: false,
        message: 'Character not found',
        statusCode: 404,
      }
    }

    response = {
      success: true,
      message: 'Character details fetched successfully.',
      data, // Return the character details under data
      statusCode: 200,
    }
    event.node.res.statusCode = response.statusCode
  } catch (error: unknown) {
    return errorHandler(error)
  }

  return response
})
