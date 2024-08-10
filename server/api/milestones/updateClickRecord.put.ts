// /server/api/milestones/updateClickRecord.put.ts

import { defineEventHandler, readBody } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const recordData = await readBody(event)

    // Check if recordData, newScore, and userId exist and are in the correct format
    if (!recordData || typeof recordData.newScore !== 'number' || typeof recordData.userId !== 'number') {
      throw new Error('Invalid JSON body')
    }

    await prisma.user.update({
      where: { id: recordData.userId },
      data: { clickRecord: recordData.newScore },
    })

    return { success: true }
  }
  catch (error: any) {
    return errorHandler(error)
  }
})
