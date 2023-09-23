// /server/api/milestones/records.post.ts
import { defineEventHandler, readBody } from 'h3'
import { PrismaClient, MilestoneRecord } from '@prisma/client'
import { errorHandler } from '../utils/error'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const recordData: Partial<MilestoneRecord> = await readBody(event)
    if (!recordData || !recordData.milestoneId || !recordData.userId) {
      throw new Error('Invalid JSON body')
    }

    // Check if the milestone record already exists for the user
    const existingRecord = await prisma.milestoneRecord.findFirst({
      where: {
        milestoneId: recordData.milestoneId,
        userId: recordData.userId
      }
    })

    if (existingRecord) {
      return { success: false, message: 'Milestone already awarded to this user.' }
    }

    // Create a new milestone record
    const newRecord = await prisma.milestoneRecord.create({ data: recordData as MilestoneRecord })
    return { success: true, record: newRecord }
  } catch (error: any) {
    return errorHandler(error)
  }
})
