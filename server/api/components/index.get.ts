import { defineEventHandler } from 'h3'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async () => {
  try {
    const components = await prisma.component.findMany()
    return { success: true, components }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
