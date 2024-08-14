// /server/api/milestones/records.get.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async () => {
  try {
    const records = await prisma.milestoneRecord.findMany()
    return { success: true, records }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
