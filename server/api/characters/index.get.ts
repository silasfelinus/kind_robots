import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const id = event.context.params?.id ? Number(event.context.params.id) : null

    // Validate the ID if provided
    if (id !== null && (isNaN(id) || id <= 0)) {
      return {
        success: false,
        message: 'Invalid ID. It must be a positive integer.',
        statusCode: 400,
      }
    }

    let data

    if (id !== null) {
      // Fetch a specific character by ID
      console.log(`Fetching character with ID: ${id}`)
      data = await prisma.character.findUnique({
        where: { id },
      })

      if (!data) {
        return {
          success: false,
          message: `Character with ID ${id} not found.`,
          statusCode: 404,
        }
      }

      console.log(`Character with ID ${id} fetched successfully.`)
    } else {
      // Fetch all characters
      console.log('Fetching all characters from the database')
      data = await prisma.character.findMany()
      console.log('All characters fetched successfully.')
    }

    return {
      success: true,
      message: id
        ? `Character with ID ${id} fetched successfully.`
        : 'All characters fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    console.error('Error occurred while fetching characters:', error)

    // Use errorHandler to get the structured error response
    const { success, message, statusCode } = errorHandler(error)
    console.log('Error details after handling:', {
      success,
      message,
      statusCode,
    })

    return {
      success,
      message,
      statusCode,
    }
  }
})
