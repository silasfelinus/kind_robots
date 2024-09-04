// /server/api/milestones/[id].delete.ts
import { defineEventHandler } from 'h3'
import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

export default defineEventHandler(async (event) => {
  try {
    const milestoneId = Number(event.context.params?.id)

    if (!milestoneId) {
      throw new Error('Milestone ID is required.')
    }

    // Delete the milestone with the given ID
    const deletedMilestone = await prisma.milestone.delete({
      where: {
        id: milestoneId,
      },
    })

    // Return success response
    return { success: true, deletedMilestone }
  } catch (error: unknown) {
    return errorHandler(error)
  }
})
