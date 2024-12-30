// /server/api/milestones/records.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  let response

  try {
    const data = await prisma.milestoneRecord.findMany()

    // Prepare the success response
    response = {
      success: true,
      message: 'Milestone records fetched successfully.',
      data, // Wrap records in a data field
      statusCode: 200,
    }
  } catch (error: unknown) {
    const handledError = errorHandler(error)
    console.error('Error fetching milestone records:', handledError)

    // Set the response and status code based on the handled error
    response = {
      success: false,
      message: handledError.message || 'Failed to fetch milestone records.',
      statusCode: handledError.statusCode || 500,
    }
  }

  return response
})
