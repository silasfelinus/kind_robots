// /server/api/tags/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const data = await prisma.tag.findMany()
    return {
      success: true,
      data,
      statusCode: 200,
    }
  } catch (error: unknown) {
    const { message, statusCode } = errorHandler(error)
    return {
      success: false,
      data: null,
      error: message || 'Failed to retrieve tags',
      statusCode: statusCode || 500,
    }
  }
})
