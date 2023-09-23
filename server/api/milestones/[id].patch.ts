// /server/api/milestones/[id].patch.ts
import { defineEventHandler, readBody } from 'h3'
import { PrismaClient, Milestone } from '@prisma/client'
import { errorHandler } from '../utils/error'

const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const id = Number(event.context.params?.id)
    if (!id) throw new Error('Invalid milestone ID.')
    const existingMilestone = await prisma.milestone.findUnique({ where: { id } })
    const milestoneData: Partial<Milestone> = await readBody(event)
    if (!existingMilestone) {
      throw new Error('Milestone not found.')
    }
    const updatedMilestone = await prisma.milestone.update({
      where: { id },
      data: milestoneData
    })
    return { success: true, milestone: updatedMilestone }
  } catch (error: any) {
    return errorHandler(error)
  }
})
