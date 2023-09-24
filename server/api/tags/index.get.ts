import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const tags = await prisma.tag.findMany()
    return { success: true, tags }
  } catch (error: any) {
    return errorHandler(error)
  }
})
