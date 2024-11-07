// server/api/components/index.get.ts

import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  let response

  try {
    // Fetch all components from the database
    const data = await prisma.component.findMany()

    // Return success response with data in a structured format
    response = {
      success: true,
      data,
      statusCode: 200, // OK
    }
  } catch (error: unknown) {
    // Pass error to errorHandler for consistent error structure
    const handledError = errorHandler(error)
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch components.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
