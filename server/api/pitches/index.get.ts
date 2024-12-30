// /server/api/pitches/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  console.log('Starting pitch retrieval...')

  try {
    console.log('Fetching pitches from the database')

    // Fetch all pitches from the database
    const data = await prisma.pitch.findMany()

    console.log('Pitches fetched successfully:', data)

    return {
      success: true,
      message: 'Pitches fetched successfully.',
      data, // Return pitches in data field
      statusCode: 200,
    }
  } catch (error: unknown) {
    console.error('Error occurred while fetching pitches:', error)

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
