// /server/api/users/milestones/[id].get.ts
import { defineEventHandler } from 'h3'
import { errorHandler } from '../../utils/error'
import prisma from './../../../../server/api/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)

  try {
    const milestoneRecords = await prisma.milestoneRecord.findMany({
      where: { userId: id },
      select: {
        milestoneId: true,
        createdAt: true,
      },
    })

    // Extract just the milestone IDs into an array
    const milestoneIds = milestoneRecords.map((record) => record.milestoneId)

    return {
      success: true,
      message: 'Milestone records fetched successfully',
      milestoneIds,
    }
  } catch (error: unknown) {
    return {
      success: false,
      message: `Failed to fetch records. Reason: ${errorHandler(error)}`,
    }
  }
})
