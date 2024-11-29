import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  console.log('Starting character retrieval...')

  try {
    console.log('Fetching characters from the database')

    // Fetch all characters from the database
    const data = await prisma.character.findMany()

    console.log('Characters fetched successfully:', data)

    return {
      success: true,
      message: 'Characters fetched successfully.',
      data, // Return characters in the data field
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
