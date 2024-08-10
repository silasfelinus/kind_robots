// /server/api/milestones/records.post.ts
import { defineEventHandler, readBody } from 'h3'
import type { MilestoneRecord } from '@prisma/client'
import { errorHandler } from '../utils/error'
import prisma from '../utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const recordData = await readBody(event)

    // Check if recordData, milestoneId, and userId exist and are in the correct format
    if (!recordData || !recordData.milestoneId || !recordData.userId) {
      throw new Error('Invalid JSON body')
    }

    // Parse to integers
    const milestoneId = parseInt(recordData.milestoneId, 10)
    const userId = parseInt(recordData.userId, 10)

    if (isNaN(milestoneId) || isNaN(userId)) {
      throw new TypeError('Invalid milestoneId or userId. They must be integers.')
    }

    // Check if the milestone record already exists for the user
    const existingRecord = await prisma.milestoneRecord.findFirst({
      where: {
        milestoneId,
        userId,
      },
    })

    if (existingRecord) {
      return { success: false, message: 'Milestone already awarded to this user.' }
    }

    // Create a new milestone record
    const newRecord = await prisma.milestoneRecord.create({
      data: {
        ...recordData,
        milestoneId,
        userId,
      } as MilestoneRecord,
    })

    return { success: true, record: newRecord }
  }
  catch (error: any) {
    return errorHandler(error)
  }
})
