// /server/api/milestones/index.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const milestones = await prisma.milestone.findMany()
    return { success: true, milestones }
  } catch (error: any) {
    return errorHandler(error)
  }
})
