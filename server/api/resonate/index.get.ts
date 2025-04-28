// /server/api/resonate/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'

export default defineEventHandler(async (event) => {
  try {
    console.log('Fetching all resonates from the database')

    const data = await prisma.resonate.findMany()

    console.log('All resonates fetched successfully.')

    return {
      success: true,
      message: 'All resonates fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    console.error('Error occurred while fetching resonates:', error)

    const { success, message, statusCode } = errorHandler(error)

    return {
      success,
      message,
      statusCode,
    }
  }
})
