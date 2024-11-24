// /server/api/art/prompts/index.get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    // Fetch all prompts and their related Art in a single consolidated function
    const data = await prisma.prompt.findMany()

    // Return success response with prompt details
    return {
      success: true,
      data,
      message: 'Prompts fetched successfully.',
    }
  } catch (error: unknown) {
    // Process error using errorHandler and log for debugging
    const { message, statusCode } = errorHandler(error)
    console.error(`Failed to fetch prompts: ${message}`)
    return {
      success: false,
      message: `Failed to fetch prompts: ${message}`,
      statusCode: statusCode || 500,
    }
  }
})
