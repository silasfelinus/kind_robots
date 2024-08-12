import prisma from '../utils/prisma'
import { errorHandler } from '../utils/error'

// Function to delete a Milestone by ID
export async function deleteMilestone(id: number): Promise<boolean> {
  try {
    const milestoneExists = await prisma.milestone.findUnique({ where: { id } })

    if (!milestoneExists) {
      return false
    }

    await prisma.milestone.delete({ where: { id } })
    return true
  }
  catch (error: unknown) {
    throw errorHandler(error)
  }
}
