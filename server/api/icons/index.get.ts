// /server/api/icons/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from './../utils/prisma'
import { errorHandler } from './../utils/error'

export default defineEventHandler(async (event) => {
  try {
    console.log('Fetching all SmartIcons from the database')

    const data = await prisma.smartIcon.findMany()

    console.log('All SmartIcons fetched successfully.')

    return {
      success: true,
      message: 'All SmartIcons fetched successfully.',
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    console.error('Error occurred while fetching SmartIcons:', error)

    const { success, message, statusCode } = errorHandler(error)

    return {
      success,
      message,
      statusCode,
    }
  }
})
