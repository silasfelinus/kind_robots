// /server/api/resonance/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'

export default defineEventHandler(async (event) => {
  try {
    console.log('Fetching all resonances from the database')

    const data = await prisma.resonance.findMany()

    console.log('All resonances fetched successfully.')

    return {
      success: true,
      message: 'All resonances fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    console.error('Error occurred while fetching resonances:', error)

    const { success, message, statusCode } = errorHandler(error)

    return {
      success,
      message,
      statusCode,
    }
  }
})
